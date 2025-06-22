"use strict";
/**
 * Generates a human-readable report from parsed what-if data.
 * @param parsedData - The structured object from parseWhatIfJson.
 * @returns A Markdown or text summary of planned infrastructure changes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReport = generateReport;
const json2md = require('json2md');
async function generateReport(parsedData) {
    // TODO: Implement report generation logic for Azure DevOps Extension
    // Example: Convert parsedData into a Markdown summary
    //return '# Bicep What-If Report\n\n_No changes detected or report logic not implemented yet._';
    return printParsedDataAsMarkdown(parsedData);
}
async function printParsedDataAsMarkdown(parsedData) {
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
    //console.log('Processing parent path:', parentPath);
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
        //result.push({ ul: [`Subresource: ${fullPath}`]})
        // Add the current delta with its full path
        const beforeItems = [];
        if (delta.before && Array.isArray(delta.before)) {
            const subItems = [];
            //console.log(`Processing ${typeof delta.before} before for path:`, fullPath);
            delta.before.forEach((element) => {
                // Dynamically get all key/value pairs in the object
                //let i: number = 0;
                //console.log(`Item array (${delta.path}): ${typeof element}`);
                Object.entries(element).forEach(([key, value]) => {
                    //console.log('Round: ', i++)
                    //console.log(`Key: ${key}, Value: ${value}`);
                    subItems.push(`${key}: ${value}`);
                });
            });
            beforeItems.push(`Before:`, { ul: subItems });
        }
        else if (typeof delta.before === 'object' && delta.before !== null) {
            //console.log(`Item Object (${delta.path}): ${typeof delta.before}`);
            const subItems = [];
            const propertyNames = Object.keys(delta.before);
            propertyNames.forEach(key => {
                const subValues = [];
                delta.before[key].forEach((value) => {
                    subValues.push(`${value}`);
                });
                subItems.push(`${key}:`, { ul: subValues });
            });
            beforeItems.push(`Before:`, { ul: subItems });
        }
        else {
            //console.log(`Item (${delta.path}): ${typeof delta.before}`);
            beforeItems.push(`Before: ${delta.before}`);
        }
        result.push({
            ul: [`Subresource: ${fullPath}`,
                {
                    ul: [
                        `Property: ${fullPath}`,
                        `Change Type: ${delta.propertyChangeType}`,
                        //`Before: ${delta.before}`,
                        `After: ${delta.after}`,
                        beforeItems
                    ]
                }
            ]
        });
        // Recursively process children if present
        if (delta.children && Array.isArray(delta.children)) {
            //console.log('Processing children for path:', fullPath);
            result.push(flattenDelta(delta.children, fullPath));
        }
    }
    return result;
}
