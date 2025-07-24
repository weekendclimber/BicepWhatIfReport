import { BuildRestClient } from 'azure-devops-extension-api/Build';
import { getAccessToken } from 'azure-devops-extension-sdk';

export type ArtifactBuildRestClient = Pick<BuildRestClient, 'getArtifacts'>;

export async function getArtifactContentZip(downloadUrl: string): Promise<ArrayBuffer | undefined> {
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

  try {
    const response = await fetch(downloadUrl, options);

    if (response.status === 302) {
      const redirectUrl = response.headers.get('location');
      if (redirectUrl) {
        return await getArtifactContentZip(redirectUrl);
      }
    } else if (response.status === undefined || response.status < 200 || response.status >= 300) {
      console.error(`Failed to download artifact: HTTP ${response.status}`);
      return undefined;
    }

    return response.arrayBuffer();
  } catch (error) {
    console.error('Error downloading artifact:', error);
    return undefined;
  }
}
