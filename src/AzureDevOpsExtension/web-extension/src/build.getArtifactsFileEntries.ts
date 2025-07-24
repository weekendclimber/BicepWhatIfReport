import JSZip from 'jszip';
import { ArtifactBuildRestClient, getArtifactContentZip } from './ArtifactBuildRestClient';

interface FileEntry {
  name: string;
  artifactName: string;
  filePath: string;
  buildId: number;
  contentsPromise: Promise<string>;
}

export async function getArtifactsFileEntries(
  buildClient: ArtifactBuildRestClient,
  project: string,
  buildId: number
): Promise<FileEntry[]> {
  const artifacts = await buildClient.getArtifacts(project, buildId);

  const files = await Promise.all(
    artifacts
      .filter(artifact => {
        // Filter for Bicep What-If report artifacts
        // Look for artifacts that might contain Bicep reports
        return (
          artifact.name === 'BicepWhatIfReport' ||
          artifact.name === 'bicep-what-if-logs' ||
          artifact.name.toLowerCase().includes('bicep') ||
          artifact.name.toLowerCase().includes('whatif') ||
          artifact.name.toLowerCase().includes('what-if')
        );
      })
      .map(async artifact => {
        const requestUrl = artifact.resource.downloadUrl;
        const arrayBuffer = await getArtifactContentZip(requestUrl);

        if (arrayBuffer) {
          try {
            const zip = await JSZip.loadAsync(arrayBuffer);

            return Object.values(zip.files)
              .filter(entry => !entry.dir && entry.name.endsWith('.md'))
              .map(entry => ({
                name: entry.name.replace(`${artifact.name}/`, ''),
                artifactName: artifact.name,
                filePath: entry.name.replace(`${artifact.name}/`, ''),
                buildId: buildId,
                contentsPromise: entry.async('string'),
              }));
          } catch (e) {
            console.error(`Error loading artifact ${artifact.name} from build ${buildId}:`, e);
            return [];
          }
        } else {
          console.warn(`Failed to download artifact ${artifact.name} from build ${buildId}`);
          return [];
        }
      })
  );

  return files.flat();
}
