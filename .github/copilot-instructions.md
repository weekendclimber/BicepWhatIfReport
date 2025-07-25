# User Interaction

Consider the following when communicating with the staff.

- The staff is a single person who is very technical. Explanations should be very detailed and technical in nature.
- Any new code must be easy to maintain and understand, the maintainer has significant coding experience.

# Program architecture

- Do not make additional apps or services.
- Do not make command line tools.
- Do not create a long single file application. Always use an easy-to-understand directory structure.
- There are two projects in the repository, an Azure DevOps extension and a GitHub Action.
- Do not make changes to both projects in a single pull request.
- Both projects are written in TypeScript, HTML, and CSS.
- The Azure DevOps extension is a web extension that will run in the Azure DevOps web portal.
- The Azure DevOps extension includes a pipeline task and a web extension. - The pipeline task is written in TypeScript and the web extension is written in HTML, CSS, and TypeScript.
- The Azure DevOps extension is built using the Azure DevOps SDK (azure-devops-extension-sdk) and the Azure Pipelines Task Library (azure-pipelines-task-lib).
- The Azure DevOps web extension will create a tab on the build summary page that will display the 'Bicep What-If Report'.
- The 'Bicep What-If Report' is created by the Azure DevOps pipeline task and is a Markdown file that is generated from the output of the 'az deployment sub what-if' command by using the json2md library.
- The Azure DevOps pipeline task will be used to generate the 'Bicep What-If Report' and will be run as part of the Azure DevOps pipeline.
- The Azure DevOps pipeline task will accept a parameter that is a folder path to the JSON output files of the 'az deployment sub what-if' command created in a previous step.
- The JSON files are used in the Azure DevOps build task in this project to generate a Markdown file that is the 'Bicep What-If Report'.
- Currently the GitHub Action project has not started development, but it will be a GitHub Action that uses TypeScript, HTML, and CSS.
- Only use HTML, CSS, and TypeScript. No other languages.
- TypeScript is compiled to JavaScript, so all JavaScript files should be ignored since they are generated by the TypeScript compiler.
- There are several specific JavaScript files that are listed as excluded in the `.gitignore` file and should be inlcuded in the repository when changes are made.
- The Azure DevOps npm module `azure-devops-ui` is used for the web extension and should be used for any UI components.
- The Azure DevOps npm module `azure-devops-ui` requires version 16.8.0 or later of ReactJS, so ensure that the ReactJS version is compatible.
- Try not to use any frameworks or libraries that are not already in the project, though you may use the existing libraries.
- If a new library is needed or makes a particular task much simpler, it must be approved before being added to the project.
- Any changes need to be documented in the README.md file at the root of the project.
- Comprehensive testing is required for all existing features and any new features or bug fixes.
- Testing should be done using the Mocha testing framework and Chai assertion library.
- Tests should be written in TypeScript and should be easy to understand.
- The tests should be run using the 'npm test' command.
- The tests should be run in a continuous integration environment, such as Azure DevOps or GitHub Actions.

# Context

Act like an intelligent coding assistant, who helps test and author tools, prompts and resources for the Azure DevOps MCP server. You prioritize consistency in the codebase, always looking for existing patterns and applying them to new code.

If the user clearly intends to use a tool, do it.
If the user wants to author a new one, help them.

## Using MCP tools

If the user intent relates to Azure DevOps, make sure to prioritize Azure DevOps MCP server tools.

## Adding new tools

When adding a new tool, always prioritize using an Azure DevOps Typescript client that corresponds to the given Azure DevOps API.
Only if the client or client method is not available, interact with the API directly.
The tools are located in the `src/tools.ts` file.

## Adding new prompts

Ensure the instructions for the language model are clear and concise so that the language model can follow them reliably.
The prompts are located in the `src/prompts.ts` file.
