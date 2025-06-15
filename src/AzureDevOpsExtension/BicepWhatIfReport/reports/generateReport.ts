/**
 * Generates a human-readable report from parsed what-if data.
 * @param parsedData - The structured object from parseWhatIfJson.
 * @returns A Markdown or text summary of planned infrastructure changes.
 */

export function generateReport(parsedData: any): string {
  // TODO: Implement report generation logic for Azure DevOps Extension
  // Example: Convert parsedData into a Markdown summary
  //return '# Bicep What-If Report\n\n_No changes detected or report logic not implemented yet._';
  return printParsedDataAsMarkdown(parsedData);
}

function printParsedDataAsMarkdown(parsedData: any): string {
  const markdown = `
  \`\`\`json
  ${JSON.stringify(parsedData, null, 2)}
  \`\`\``;
  return markdown;
}