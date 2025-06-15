"use strict";
/**
 * Generates a human-readable report from parsed what-if data.
 * @param parsedData - The structured object from parseWhatIfJson.
 * @returns A Markdown or text summary of planned infrastructure changes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReport = generateReport;
const json2md = require('json2md');
//import json2md from 'json2md';
function generateReport(parsedData) {
    // TODO: Implement report generation logic for Azure DevOps Extension
    // Example: Convert parsedData into a Markdown summary
    //return '# Bicep What-If Report\n\n_No changes detected or report logic not implemented yet._';
    return printParsedDataAsMarkdown(parsedData);
}
function printParsedDataAsMarkdown(parsedData) {
    //const markdown = `
    //\`\`\`json
    //${JSON.stringify(parsedData, null, 2)}
    //\`\`\``;
    const markdownData = [];
    parsedData.changes.forEach((change) => {
        const after = change.after || {};
        markdownData.push({ h2: `Resource: ${after.name || 'Unnamed Resource'}` });
        markdownData.push({
            ul: [
                `**Change Type**: ${change.changeType || 'Unknown Change Type'}`,
                `**Resource ID**: ${change.resourceId || 'Unknown ID'}`,
                `**Type**: ${after.type || 'Unknown Type'}`,
                `**Location**: ${after.location || 'Unknown Location'}`
            ]
        });
    });
    if (parsedData.diagnostics) {
        parsedData.diagnostics.forEach((diag) => {
            markdownData.push({ h2: `Diagnostic: ${diag.code || 'Unknown Diagnostic'}` });
            markdownData.push({
                ul: [
                    `**Level**: ${diag.level || 'Unknown Level'}`,
                    `**Message**: ${diag.message || 'No message provided'}`,
                    `**Target**: ${diag.target || 'No target provided'}`
                ]
            });
        });
    }
    const markdown = json2md(markdownData);
    return markdown;
}
