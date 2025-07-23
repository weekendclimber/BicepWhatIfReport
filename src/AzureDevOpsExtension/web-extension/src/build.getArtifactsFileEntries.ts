import * as JSZip from 'jszip';
import { BuildRestClient } from 'azure-devops-extension-api/Build';
import { getAccessToken } from 'azure-devops-extension-sdk';

/**
 * Interface representing a file entry extracted from a build artifact
 */
interface FileEntry {
  /** The name of the file without the artifact path prefix */
  name: string;
  /** The name of the artifact this file came from */
  artifactName: string;
  /** The full file path within the artifact */
  filePath: string;
  /** The build ID this artifact belongs to */
  buildId: number;
  /** Promise that resolves to the file contents as a string */
  contentsPromise: Promise<string>;
}

/**
 * Type alias for BuildRestClient with only the methods we need
 */
export type ArtifactBuildRestClient = Pick<BuildRestClient, 'getArtifacts'>;

/**
 * Downloads artifact content as a ZIP file from Azure DevOps
 * Based on Microsoft SARIF extension implementation
 *
 * @param downloadUrl The download URL for the artifact
 * @returns Promise that resolves to the artifact content as ArrayBuffer
 */
export async function getArtifactContentZip(downloadUrl: string): Promise<ArrayBuffer | undefined> {
  try {
    const accessToken = await getAccessToken();
    const acceptType = 'application/zip';
    const acceptHeaderValue = `${acceptType};excludeUrls=true;enumsAsNumbers=true;msDateFormat=true;noArrayWrap=true`;

    const headers = new Headers();
    headers.append('Accept', acceptHeaderValue);
    headers.append('Authorization', 'Bearer ' + accessToken);
    headers.append('Content-Type', 'application/zip');
    headers.append('X-VSS-ReauthenticationAction', 'Suppress');

    const options: RequestInit = {
      method: 'GET',
      mode: 'cors',
      credentials: 'same-origin',
      headers: headers,
    };

    console.log(`Downloading artifact ZIP from: ${downloadUrl}`);
    const response = await fetch(downloadUrl, options);

    // Handle redirects
    if (response.status === 302) {
      const redirectUrl = response.headers.get('location');
      if (redirectUrl) {
        console.log(`Following redirect to: ${redirectUrl}`);
        return await getArtifactContentZip(redirectUrl);
      } else {
        throw new Error('Received redirect response but no location header');
      }
    }

    // Check for successful response
    if (response.status === undefined || response.status < 200 || response.status >= 300) {
      console.error(`HTTP ${response.status}: ${response.statusText}`);
      return undefined;
    }

    console.log('Successfully downloaded artifact ZIP');
    return response.arrayBuffer();
  } catch (error) {
    console.error('Error downloading artifact ZIP:', error);
    throw error;
  }
}

/**
 * Extracts file entries from Azure DevOps build artifacts
 * Filters for Bicep What-If related markdown files created by the build task
 *
 * @param buildClient The Azure DevOps build client
 * @param project The project ID or name
 * @param buildId The build ID to get artifacts from
 * @returns Promise that resolves to an array of file entries
 */
export async function getArtifactsFileEntries(
  buildClient: ArtifactBuildRestClient,
  project: string,
  buildId: number
): Promise<FileEntry[]> {
  try {
    console.log(`Getting artifacts for build ${buildId} in project ${project}`);
    const artifacts = await buildClient.getArtifacts(project, buildId);

    console.log(`Found ${artifacts.length} artifacts for build ${buildId}`);

    const files = await Promise.all(
      artifacts
        .filter(artifact => {
          // Filter for artifacts that might contain Bicep What-If markdown reports
          // Look for common artifact names or patterns
          const name = artifact.name.toLowerCase();
          return (
            name.includes('bicep') ||
            name.includes('whatif') ||
            name.includes('what-if') ||
            name.includes('report') ||
            name.includes('analysis') ||
            // Include common pipeline artifact names
            name.includes('drop') ||
            name.includes('build') ||
            // Allow artifacts ending with .md
            name.endsWith('.md')
          );
        })
        .map(async artifact => {
          try {
            console.log(`Processing artifact: ${artifact.name}`);

            if (!artifact.resource?.downloadUrl) {
              console.warn(`Artifact ${artifact.name} does not have a downloadUrl`);
              return [];
            }

            const requestUrl = artifact.resource.downloadUrl;
            const arrayBuffer = await getArtifactContentZip(requestUrl);

            if (arrayBuffer) {
              const zip = await JSZip.loadAsync(arrayBuffer);

              console.log(
                `Loaded ZIP for artifact ${artifact.name}, found ${Object.keys(zip.files).length} files`
              );

              return Object.values(zip.files)
                .filter(entry => {
                  // Filter for markdown files created by the build task
                  if (entry.dir) return false;

                  const fileName = entry.name.toLowerCase();
                  return (
                    fileName.endsWith('.md') ||
                    fileName.endsWith('.markdown') ||
                    // Include What-If specific patterns for backwards compatibility
                    fileName.includes('whatif') ||
                    fileName.includes('what-if') ||
                    fileName.includes('bicep')
                  );
                })
                .map(entry => {
                  const displayName = entry.name.replace(`${artifact.name}/`, '');

                  console.log(`Found relevant file: ${entry.name} (display: ${displayName})`);

                  return {
                    name: displayName,
                    artifactName: artifact.name,
                    filePath: entry.name,
                    buildId: buildId,
                    contentsPromise: entry.async('string'),
                  };
                });
            } else {
              console.warn(`Failed to download ZIP content for artifact ${artifact.name}`);
              return [];
            }
          } catch (error) {
            console.error(
              `Error processing artifact ${artifact.name} from build ${buildId}:`,
              error
            );
            return [];
          }
        })
    );

    const flatFiles = files.flat();
    console.log(`Extracted ${flatFiles.length} relevant files from artifacts`);

    return flatFiles;
  } catch (error) {
    console.error('Error getting artifacts file entries:', error);
    throw error;
  }
}

export { FileEntry };
