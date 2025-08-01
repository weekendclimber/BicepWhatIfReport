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
 * Following SpotCheck's working pattern exactly
 */
async function getArtifactContentZip(downloadUrl: string): Promise<ArrayBuffer> {
  const accessToken = await getAccessToken();
  const acceptType = 'application/zip';
  const acceptHeaderValue = `${acceptType};excludeUrls=true;enumsAsNumbers=true;msDateFormat=true;noArrayWrap=true`;

  const options: RequestInit = {
    method: 'GET',
    mode: 'cors',
    credentials: 'same-origin',
    headers: new Headers({
      Accept: acceptHeaderValue,
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/zip',
      'X-VSS-ReauthenticationAction': 'Suppress',
    }),
  };

  console.log('Downloading artifact with authorization headers...');
  const response = await fetch(downloadUrl, options);

  if (response.status === 302) {
    const redirectUrl = response.headers.get('location') as string;
    console.log('Following redirect to:', redirectUrl);
    return await getArtifactContentZip(redirectUrl);
  } else if (response.status === undefined || response.status < 200 || response.status >= 300) {
    console.error('Failed to download artifact. Status:', response.status, response.statusText);
    return new ArrayBuffer(0);
  }

  console.log('Artifact downloaded successfully. Size:', response.headers.get('content-length'));
  return await response.arrayBuffer();
}

/**
 * Get artifacts and extract markdown files using SpotCheck's exact pattern
 */
export async function getArtifactsFileEntries(
  buildClient: BuildRestClient,
  project: string,
  buildId: number,
  artifactName: string
): Promise<FileEntry[]> {
  console.log(
    `Getting artifacts for project: ${project}, buildId: ${buildId}, artifactName: ${artifactName}`
  );

  // Get all artifacts for the build
  const artifacts = await buildClient.getArtifacts(project, buildId);
  console.log(
    `Found ${artifacts.length} total artifacts:`,
    artifacts.map(a => a.name)
  );

  // Filter for our specific artifact
  const targetArtifacts = artifacts.filter(a => a.name === artifactName);

  if (targetArtifacts.length === 0) {
    console.log(`No artifacts found with name: ${artifactName}`);
    return [];
  }

  const [artifact] = targetArtifacts;
  if (!artifact?.resource) {
    console.log('Artifact has no resource/download URL');
    return [];
  }

  console.log(`Processing artifact: ${artifact.name}, URL: ${artifact.resource.downloadUrl}`);

  const requestUrl = artifact.resource.downloadUrl;
  const arrayBuffer = await getArtifactContentZip(requestUrl);

  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    console.log('Failed to download artifact content');
    return [];
  }

  console.log(`Downloaded ${arrayBuffer.byteLength} bytes`);

  // Check if JSZip is available (following SpotCheck pattern)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const JSZip = (window as any).JSZip;
  if (!JSZip) {
    console.error('JSZip library not available');
    return [];
  }

  try {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const fileEntries: FileEntry[] = [];

    console.log('ZIP contents:', Object.keys(zip.files));

    // Extract all markdown files from the ZIP
    for (const fileName in zip.files) {
      const file = zip.files[fileName];
      if (!file.dir && fileName.endsWith('.md')) {
        console.log(`Extracting markdown file: ${fileName}`);
        const content = await file.async('string');
        fileEntries.push({
          name: fileName.replace(`${artifact.name}/`, ''), // Remove artifact prefix
          content: content,
          artifactName: artifact.name,
        });
      }
    }

    console.log(`Extracted ${fileEntries.length} markdown files`);
    return fileEntries;
  } catch (error) {
    console.error(`Error loading artifact ${artifact.name} from build ${buildId}:`, error);
    return [];
  }
}

/**
 * Download artifacts using SpotCheck's exact pattern
 */
export async function downloadArtifacts(artifactName: string): Promise<FileEntry[]> {
  // Get project info following SpotCheck pattern
  const pps = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
  const project = await pps.getProject();
  const projectName = project?.name ?? '';

  if (!projectName) {
    console.error('No project name available');
    return [];
  }

  // Get build info following SpotCheck pattern
  const buildPageService: IBuildPageDataService = await SDK.getService(
    BuildServiceIds.BuildPageDataService
  );
  const buildPageData = await buildPageService.getBuildPageData();
  const buildId = buildPageData?.build?.id ?? 0;

  if (!buildId) {
    console.error('No build ID available');
    return [];
  }

  console.log(
    `SpotCheck pattern: project=${projectName}, buildId=${buildId}, artifact=${artifactName}`
  );

  // Use SpotCheck's client pattern
  const buildClient = getClient(BuildRestClient);
  const fileEntries = await getArtifactsFileEntries(
    buildClient,
    projectName,
    buildId,
    artifactName
  );

  return fileEntries;
}
