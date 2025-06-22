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
async function generateReport(parsedData) {
    // TODO: Implement report generation logic for Azure DevOps Extension
    // Example: Convert parsedData into a Markdown summary
    //return '# Bicep What-If Report\n\n_No changes detected or report logic not implemented yet._';
    return printParsedDataAsMarkdown(parsedData);
}
async function printParsedDataAsMarkdown(parsedData) {
    //const markdown = `
    //\`\`\`json
    //${JSON.stringify(parsedData, null, 2)}
    //\`\`\``;
    const markdownData = [];
    markdownData.push({ h1: 'Bicep What-If Report' });
    parsedData.changes.forEach((change) => {
        //Note: The following fields are always null or empty in the parsedData:
        // deploymentId
        // identifiers
        // sympbolicname
        // unsupportedReason
        // Get the before and after states: note before could be null
        const after = change.after || {};
        const before = change.before || {};
        // Get the common header fields for each change
        markdownData.push({ h2: `Resource: ${after.name || 'Unnamed Resource'}` }, { code: { language: "text", content: `Resource ID: ${change.resourceId || 'Unknown Resource ID'}` } }, { h3: `Change Type: ${change.changeType}` });
        // If change.ChangeType is 'NoChange' or 'Ignore', we can handle them the same way
        if (change.changeType === 'NoChange' || change.changeType === 'Ignore') {
            //No change:
            // before and after are the same
            // delta is empty
            // resourceId is present
            markdownData.push({ h4: `**Details**` });
            const ulItems = [];
            ulItems.push(`**Name**: **${after.name || 'Unknown Name'}**`, `Type: ${after.type || 'Unknown Type'}`, `Location: ${after.location || 'Unknown Location'}`);
            if (after.resourceGroup) {
                ulItems.push(`Resource Group: ${after.resourceGroup || 'Unknown Resource Group'}`);
            }
            ulItems.push(`API Version: ${after.apiVersion || 'Unknown API Version'}`, `Resource ID: ${after.resourceId || 'Unknown Resource ID'}`);
            markdownData.push({ ul: ulItems });
        }
        else if (change.changeType === 'Modify') {
            //Modify:
            // before and after are different
            // delta is present and lists the changes
            // resourceId is present
            change.delta.forEach((delta) => {
                const children = [];
                if (delta.children && Array.isArray(delta.children)) {
                    children.push(flattenDelta(delta.children, delta.path));
                }
                const ulItems = [];
                ulItems.push(`Property: ${delta.path || 'Unknown Property'}`, `Before: ${delta.before || 'N/A'}`, `After: ${delta.after || 'N/A'}`, `Change Type: ${delta.propertyChangeType || 'Unknown Change Type'}`);
                //if (children.length > 0) {
                //  ulItems.push(
                //    `Subresource(s):`,
                //    //${children}
                //  );
                //}
                markdownData.push({ h4: `**Change Details**` }, { ul: ulItems }, children);
            });
        }
        else if (change.changeType === 'Create') {
            //Create:
            // before is null
            // after is present
            // delta is null
            // resourceId is present
        }
        //markdownData.push({
        //  h4: `**After Details**`,
        //  ul: [
        //    `**After Name**: **${after.name || 'Unknown Name'}**`,
        //    `After Type: ${after.type || 'Unknown Type'}`,
        //    `After Location: ${after.location || 'Unknown Location'}`,
        //    `After API Version: ${after.apiVersion || 'Unknown API Version'}`
        //  ],
        //},
        //{
        //  h4: `**Before Details**`,
        //  ul: [
        //    `**Before Name**: **${before.name || 'Unknown Name'}**`,
        //    `Before Type: ${before.type || 'Unknown Type'}`,
        //    `Before Location: ${before?.location || 'N/A'}`,
        //    `Before API Version: ${before.apiVersion || 'Unknown API Version'}`
        //  ]
        //});
        markdownData.push({ hr: "" });
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
// Recursive function to flatten delta objects and their children
function flattenDelta(deltaArray, parentPath = '') {
    console.log('Processing parent path:', parentPath);
    if (!deltaArray)
        return [];
    let result = [];
    for (const delta of deltaArray) {
        // Build the full path for nested properties
        const isInt = Number.isInteger(Number(delta.path));
        const pathSegment = isInt ? `[${delta.path}]` : `${delta.path}`;
        const fullPath = parentPath
            ? `${parentPath}${isInt ? pathSegment : '.' + delta.path}`
            : parentPath;
        // Add the current delta with its full path
        result.push({
            ul: [`Subresource: ${fullPath}`,
                {
                    ul: [
                        `Property: ${fullPath}`,
                        `Before: ${delta.before}`,
                        `After: ${delta.after}`,
                        `Change Type: ${delta.propertyChangeType}`
                    ]
                }
            ]
        });
        // Recursively process children if present
        if (delta.children && Array.isArray(delta.children)) {
            console.log('Processing children for path:', fullPath);
            result.push(flattenDelta(delta.children, fullPath));
        }
    }
    return result;
}
