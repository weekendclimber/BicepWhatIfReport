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
  const attachments = await buildClient.getAttachments(projectId, buildId, "text/markdown");

  // If you have a MarkdownRenderer, instantiate it here
  // const markdownRenderer = new MarkdownRenderer();
  const container: HTMLElement | null = document.getElementById("markdown-container");

  if (attachments.length > 0) {
    for (const attachment of attachments) {
      // Fetch the attachment content
      //const content = await buildClient //.getAttachmentContent(projectId, buildId, attachment.id);
      
      // Create a new div for each attachment
      const attachmentDiv = document.createElement("div");
      attachmentDiv.className = "markdown-attachment";
      
      // Set the inner HTML of the div to the content
      attachmentDiv.innerHTML = content;

      // Append the attachment div to the container
      if (container) {
        container.appendChild(attachmentDiv);
      } else {
        console.error("Container not found for appending markdown content.");
      }

      // If you have a MarkdownRenderer, you can use it here to render the content
      // markdownRenderer.render(content, attachmentDiv);
    }
  } else if (container) {
    container.innerHTML = "<p>No markdown files found for this build.</p>";
  }
}

initializeTab();