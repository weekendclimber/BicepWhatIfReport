"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const SDK = __importStar(require("azure-devops-extension-sdk"));
const azure_devops_extension_api_1 = require("azure-devops-extension-api");
const Build_1 = require("azure-devops-extension-api/Build");
SDK.init();
async function initializeTab() {
    const buildClient = (0, azure_devops_extension_api_1.getClient)(Build_1.BuildRestClient);
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
    const container = document.getElementById("markdown-container");
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
    }
    else if (container) {
        container.innerHTML = "<p>No markdown files found for this build.</p>";
    }
}
initializeTab();
