import {
  BuildRestClient,
  BuildServiceIds,
  IBuildPageDataService,
} from 'azure-devops-extension-api/Build';
import { getAccessToken } from 'azure-devops-extension-sdk';
import { getClient } from 'azure-devops-extension-api';
import * as SDK from 'azure-devops-extension-sdk';
import { CommonServiceIds, IProjectPageService } from 'azure-devops-extension-api';

export interface FileEntry {
  name: string;
  content: string;
  artifactName: string;
}

/**
 * Download artifact content as ZIP with proper authorization headers
 * Following SpotCheck's working pattern exactly with comprehensive debugging
 */
async function getArtifactContentZip(downloadUrl: string): Promise<ArrayBuffer> {
  console.log(`[getArtifactContentZip] Starting download from: ${downloadUrl}`);

  try {
    const accessToken = await getAccessToken();
    console.log(
      `[getArtifactContentZip] Access token length: ${accessToken ? accessToken.length : 0}`
    );

    const acceptType = 'application/zip';
    const acceptHeaderValue = `${acceptType};excludeUrls=true;enumsAsNumbers=true;msDateFormat=true;noArrayWrap=true`;

    const headers = {
      Accept: acceptHeaderValue,
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/zip',
      'X-VSS-ReauthenticationAction': 'Suppress',
    };

    console.log('[getArtifactContentZip] Request headers:', {
      Accept: acceptHeaderValue,
      Authorization: `Bearer ${accessToken ? accessToken.substring(0, 10) + '...' : 'null'}`,
      'Content-Type': 'application/zip',
      'X-VSS-ReauthenticationAction': 'Suppress',
    });

    const options: RequestInit = {
      method: 'GET',
      mode: 'cors',
      credentials: 'same-origin',
      headers: new Headers(headers),
    };

    console.log('[getArtifactContentZip] Making fetch request...');
    const fetchStartTime = Date.now();
    const response = await fetch(downloadUrl, options);
    const fetchDuration = Date.now() - fetchStartTime;

    console.log(`[getArtifactContentZip] Fetch completed in ${fetchDuration}ms`);
    console.log(
      `[getArtifactContentZip] Response status: ${response.status} ${response.statusText}`
    );
    console.log(
      `[getArtifactContentZip] Response headers:`,
      Object.fromEntries(response.headers.entries())
    );

    if (response.status === 302) {
      const redirectUrl = response.headers.get('location') as string;
      console.log(`[getArtifactContentZip] Following redirect to: ${redirectUrl}`);
      return await getArtifactContentZip(redirectUrl);
    } else if (response.status === undefined || response.status < 200 || response.status >= 300) {
      console.error(
        `[getArtifactContentZip] Failed to download artifact. Status: ${response.status} ${response.statusText}`
      );
      console.error(
        `[getArtifactContentZip] Response text:`,
        await response.text().catch(() => 'Unable to read response text')
      );
      return new ArrayBuffer(0);
    }

    const contentLength = response.headers.get('content-length');
    console.log(
      `[getArtifactContentZip] Artifact downloaded successfully. Content-Length: ${contentLength}`
    );

    const arrayBufferStartTime = Date.now();
    const arrayBuffer = await response.arrayBuffer();
    const arrayBufferDuration = Date.now() - arrayBufferStartTime;

    console.log(
      `[getArtifactContentZip] ArrayBuffer conversion completed in ${arrayBufferDuration}ms. Size: ${arrayBuffer.byteLength} bytes`
    );
    return arrayBuffer;
  } catch (error) {
    console.error('[getArtifactContentZip] Error downloading artifact:', error);
    console.error(`[getArtifactContentZip] Error type: ${(error as any)?.constructor?.name}`);
    console.error(`[getArtifactContentZip] Error message: ${(error as any)?.message}`);
    throw error;
  }
}

/**
 * Get artifacts and extract markdown files using SpotCheck's exact pattern
 * Uses project name only (not project ID) as per SpotCheck's working implementation
 */
export async function getArtifactsFileEntries(
  buildClient: BuildRestClient,
  project: string,
  buildId: number,
  artifactName: string
): Promise<FileEntry[]> {
  console.log(
    `[getArtifactsFileEntries] Starting - project: "${project}", buildId: ${buildId}, artifactName: "${artifactName}"`
  );

  try {
    // Use project name only - SpotCheck pattern
    console.log('[getArtifactsFileEntries v0.2.28] Calling getArtifacts with project name...');

    const startTime = Date.now();
    const artifacts = await buildClient.getArtifacts(project, buildId);
    const duration = Date.now() - startTime;

    console.log(`[getArtifactsFileEntries] getArtifacts completed in ${duration}ms`);

    console.log(
      `[getArtifactsFileEntries] Found ${artifacts.length} total artifacts:`,
      artifacts.map(a => `"${a.name}"`)
    );

    // Filter for our specific artifact - SpotCheck pattern
    const targetArtifacts = artifacts.filter(a => a.name === artifactName);
    console.log(
      `[getArtifactsFileEntries] Filtered to ${targetArtifacts.length} matching artifacts for "${artifactName}"`
    );

    if (targetArtifacts.length === 0) {
      console.log(`[getArtifactsFileEntries] No artifacts found with name: "${artifactName}"`);
      console.log(
        '[getArtifactsFileEntries] Available artifact names:',
        artifacts.map(a => a.name)
      );
      return [];
    }

    const [artifact] = targetArtifacts;
    if (!artifact?.resource) {
      console.log('[getArtifactsFileEntries] Artifact has no resource/download URL');
      console.log('[getArtifactsFileEntries] Artifact details:', JSON.stringify(artifact, null, 2));
      return [];
    }

    console.log(`[getArtifactsFileEntries] Processing artifact: "${artifact.name}"`);
    console.log(`[getArtifactsFileEntries] Download URL: ${artifact.resource.downloadUrl}`);

    const requestUrl = artifact.resource.downloadUrl;
    console.log('[getArtifactsFileEntries] Starting ZIP download...');

    const downloadStartTime = Date.now();
    const arrayBuffer = await getArtifactContentZip(requestUrl);
    const downloadDuration = Date.now() - downloadStartTime;

    console.log(`[getArtifactsFileEntries] ZIP download completed in ${downloadDuration}ms`);

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      console.log(
        '[getArtifactsFileEntries] Failed to download artifact content or empty response'
      );
      return [];
    }

    console.log(`[getArtifactsFileEntries] Downloaded ${arrayBuffer.byteLength} bytes`);

    // Check if JSZip is available (following SpotCheck pattern)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const JSZip = (window as any).JSZip;
    if (!JSZip) {
      console.error('[getArtifactsFileEntries] JSZip library not available');
      return [];
    }

    console.log('[getArtifactsFileEntries] Loading ZIP with JSZip...');
    const zipStartTime = Date.now();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const zipDuration = Date.now() - zipStartTime;

    console.log(`[getArtifactsFileEntries] ZIP loaded in ${zipDuration}ms`);

    const fileEntries: FileEntry[] = [];
    const zipFiles = Object.keys(zip.files);
    console.log(`[getArtifactsFileEntries] ZIP contains ${zipFiles.length} files:`, zipFiles);

    // Extract all markdown files from the ZIP - following SpotCheck pattern
    let markdownCount = 0;
    for (const fileName in zip.files) {
      const file = zip.files[fileName];
      if (!file.dir && fileName.endsWith('.md')) {
        console.log(`[getArtifactsFileEntries] Extracting markdown file: "${fileName}"`);
        markdownCount++;

        const extractStartTime = Date.now();
        const content = await file.async('string');
        const extractDuration = Date.now() - extractStartTime;

        console.log(
          `[getArtifactsFileEntries] Extracted "${fileName}" (${content.length} chars) in ${extractDuration}ms`
        );

        fileEntries.push({
          name: fileName.replace(`${artifact.name}/`, ''), // Remove artifact prefix
          content: content,
          artifactName: artifact.name,
        });
      }
    }

    console.log(
      `[getArtifactsFileEntries] Successfully extracted ${fileEntries.length} markdown files out of ${markdownCount} found`
    );
    return fileEntries;
  } catch (error) {
    console.error(
      `[getArtifactsFileEntries] Error processing artifact "${artifactName}" from build ${buildId}:`,
      error
    );
    console.error(`[getArtifactsFileEntries] Error type: ${(error as any)?.constructor?.name}`);
    console.error(`[getArtifactsFileEntries] Error message: ${(error as any)?.message}`);
    console.error(`[getArtifactsFileEntries] Error stack:`, (error as any)?.stack);
    throw error;
  }
}

/**
 * Download artifacts using SpotCheck's exact pattern
 * Uses project name only for getArtifacts calls
 */
export async function downloadArtifacts(artifactName: string): Promise<FileEntry[]> {
  console.log(`[ArtifactService] Starting downloadArtifacts for: ${artifactName}`);

  try {
    // Step 1: Get project info following SpotCheck pattern
    console.log('[ArtifactService] Getting project info via ProjectPageService...');
    const pps = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
    const project = await pps.getProject();
    const projectName = project?.name ?? '';

    console.log(`[ArtifactService] Project details - Name: "${projectName}"`);

    if (!projectName) {
      throw new Error('Required context not available: No project name from ProjectPageService');
    }

    // Step 2: Get build info following SpotCheck pattern
    console.log('[ArtifactService] Getting build page data via BuildPageDataService...');
    const buildPageService: IBuildPageDataService = await SDK.getService(
      BuildServiceIds.BuildPageDataService
    );
    const buildPageData = await buildPageService.getBuildPageData();
    const buildId = buildPageData?.build?.id ?? 0;
    const definitionId = buildPageData?.definition?.id ?? 0;
    const buildNumber = buildPageData?.build?.buildNumber ?? 'Unknown';

    console.log(
      `[ArtifactService] Build details - ID: ${buildId}, Number: "${buildNumber}", Definition ID: ${definitionId}`
    );

    if (!buildId) {
      throw new Error(
        'Required context not available: No build ID from BuildPageDataService. Please access this extension from a build summary page.'
      );
    }

    // Step 3: Get access token for authorization
    console.log('[ArtifactService] Getting access token...');
    const accessToken = await getAccessToken();
    const tokenLength = accessToken ? accessToken.length : 0;
    console.log(`[ArtifactService] Access token length: ${tokenLength} characters`);

    if (!accessToken) {
      throw new Error('No access token available for authorization');
    }

    // Step 4: Use SpotCheck's client pattern
    console.log('[ArtifactService] Creating BuildRestClient...');
    const buildClient = getClient(BuildRestClient);
    console.log('[ArtifactService] BuildRestClient created successfully');

    console.log(
      `[ArtifactService] Calling getArtifactsFileEntries with project="${projectName}", buildId=${buildId}, artifactName="${artifactName}"`
    );

    // Call with project name only - SpotCheck pattern
    const fileEntries = await getArtifactsFileEntries(
      buildClient,
      projectName,
      buildId,
      artifactName
    );

    console.log(`[ArtifactService] Successfully retrieved ${fileEntries.length} file entries`);
    return fileEntries;
  } catch (error) {
    console.error('[ArtifactService] Error in downloadArtifacts:', error);
    throw error;
  }
}
