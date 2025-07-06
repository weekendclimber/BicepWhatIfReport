import * as SDK from "azure-devops-extension-sdk";
import { getClient } from "azure-devops-extension-api";
import { BuildRestClient } from "azure-devops-extension-api/Build";

SDK.init();

async function initializeTab() {
  const buildClient = getClient(BuildRestClient);

  // Ensure the SDK is ready before proceeding
  await SDK.ready();
  // Get the build ID and project ID from the SDK configuration
  const buildId = SDK.getConfiguration().buildId;
  const projectId = SDK.getConfiguration().project?.id || SDK.getConfiguration().projectId;
  
  // Get the attachments from the build within the directory
  // Note: The buildId and projectId should be available in the SDK configuration
  

  // Use getArtifacts to get the list of artifacts for the build
  const artifacts = await buildClient.getArtifacts(projectId, buildId);

  // If you have a MarkdownRenderer, instantiate it here
  // const markdownRenderer = new MarkdownRenderer();
  const container: HTMLElement | null = document.getElementById("markdown-container");

  if (artifacts.length > 0) {
    for (const artifact of artifacts) {
      // Only process artifacts of type "Container" or as needed
      if (artifact.resource && artifact.resource.type === "Container") {
        // Download the artifact content (you may need to fetch the file from the artifact's URL)
        const response = await fetch(artifact.resource.downloadUrl);
        const markdownContent = await response.text();
        // If you have a MarkdownRenderer, use it to render
        // const renderedHtml = markdownRenderer.render(markdownContent);
        // For now, just display the markdown as plain text
        const div = document.createElement("div");
        div.innerText = markdownContent;
        container?.appendChild(div);
      }
    }
  } else if (container) {
    container.innerHTML = "<p>No markdown files found for this build.</p>";
  }
}

initializeTab();