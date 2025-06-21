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
  markdownData.push({ h1: 'Bicep What-If Report' });

  parsedData.changes.forEach((change: any) => {
    //Note: The following fields are always null or empty in the parsedData:
    // deploymentId
    // identifiers
    // sympbolicname
    // unsupportedReason
    if (change.ChangeType === 'NoChange') {
      //No change:
      // before and after are the same
      // delta is empty
      // resourceId is present
    } else if (change.ChangeType === 'Ignore') {
      //Ignore:
      // before and after are the same
      // delta is null
      // resourceId is present
    } else if (change.ChangeType === 'Modify') {
      //Modify:
      // before and after are different
      // delta is present and lists the changes
      // resourceId is present
    } else if (change.ChangeType === 'Create') {
      //Create:
      // before is null
      // after is present
      // delta is null
      // resourceId is present
    }
    const after = change.after || {};
    const before = change.before || {};
    markdownData.push({ h2: `Resource: ${after.name || 'Unnamed Resource'}` });
    markdownData.push({ h3: `Change Type: ${change.changeType || 'Unknown Change Type'}` });
    markdownData.push({
      h4: `**After Details**`,
      ul: [
        `**After Name**: **${after.name || 'Unknown Name'}**`,
        `After Type: ${after.type || 'Unknown Type'}`,
        `After Location: ${after.location || 'Unknown Location'}`,
        `After API Version: ${after.apiVersion || 'Unknown API Version'}`
      ],
    },
    {
      h4: `**Before Details**`,
      ul: [
        `**Before Name**: **${before.name || 'Unknown Name'}**`,
        `Before Type: ${before.type || 'Unknown Type'}`,
        `Before Location: ${before?.location || 'N/A'}`,
        `Before API Version: ${before.apiVersion || 'Unknown API Version'}`
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