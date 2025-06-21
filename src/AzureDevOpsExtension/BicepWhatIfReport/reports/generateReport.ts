/**
 * Generates a human-readable report from parsed what-if data.
 * @param parsedData - The structured object from parseWhatIfJson.
 * @returns A Markdown or text summary of planned infrastructure changes.
 */

const json2md = require('json2md');
//import json2md from 'json2md';

export async function generateReport(parsedData: any): Promise<string> {
  // TODO: Implement report generation logic for Azure DevOps Extension
  // Example: Convert parsedData into a Markdown summary
  //return '# Bicep What-If Report\n\n_No changes detected or report logic not implemented yet._';
  return printParsedDataAsMarkdown(parsedData) as Promise<string>;
}

async function printParsedDataAsMarkdown(parsedData: any): Promise<string> {
  //const markdown = `
  //\`\`\`json
  //${JSON.stringify(parsedData, null, 2)}
  //\`\`\``;
  const markdownData: any = []

  parsedData.changes.forEach((change: any) => {
    const after = change.after || {};
    const before = change.before || {};
    markdownData.push({ h2: `Resource: ${after.name || 'Unnamed Resource'}` });
    markdownData.push({
      ul: [
        `**Change Type**: ${change.changeType || 'Unknown Change Type'}`,
        `**Resource ID**: ${change.resourceId || 'Unknown ID'}`,
        `**After Type**: ${after.type || 'Unknown Type'}`,
        {
          ul: [`Before Type: ${before?.type || 'N/A'}`]
        },
        `**Location**: ${after.location || 'Unknown Location'}`
      ]
    });
  });

if (parsedData.diagnostics) {
  parsedData.diagnostics.forEach((diag: any) => {
    markdownData.push({ h2: `Diagnostic: ${diag.code || 'Unknown Diagnostic'}` });
    markdownData.push({
      ul: [
        `**Level**: ${diag.level || 'Unknown Level'}`,
        `**Message**: ${diag.message || 'No message provided'}`,
        `**Target**: ${diag.target || 'No target provided'}`
      ]
    })
  });
}

  const markdown: string = json2md(markdownData);
  return markdown;
}