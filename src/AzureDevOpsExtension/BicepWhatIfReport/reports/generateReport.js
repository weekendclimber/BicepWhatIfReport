"use strict";
/**
 * Generates a human-readable report from parsed what-if data.
 * @param parsedData - The structured object from parseWhatIfJson.
 * @returns A Markdown or text summary of planned infrastructure changes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReport = generateReport;
exports.jsonToMarkdown = jsonToMarkdown;
const json2md = require('json2md');
async function generateReport(parsedData) {
    // TODO: Implement report generation logic for Azure DevOps Extension
    // Example: Convert parsedData into a Markdown summary
    //return '# Bicep What-If Report\n\n_No changes detected or report logic not implemented yet._';
    //return printParsedDataAsMarkdown(parsedData) as Promise<string>;
    return jsonToMarkdown(parsedData);
}
;
async function jsonToMarkdown(jsonData) {
    const markdownData = [{ h1: 'Bicep What-If Report' }];
    console.log(`Generating Markdown report for ${jsonData.changes.length} changes.`);
    jsonData.changes.forEach((change) => {
        markdownData.push(...processChange(change));
    });
    const markdown = json2md(markdownData);
    return markdown;
}
;
function processChange(change) {
    const markdownData = [];
    const { after, changeType, delta, resourceId } = change;
    // Add common header fields for each change
    const resName = after?.name?.toString() || 'Unnamed Resource';
    const type = after?.type?.toString() || 'Unknown Type';
    const location = after?.location?.toString() || 'Unknown Location';
    const apiVersion = after?.apiVersion?.toString() || 'Unknown API Version';
    const resGroup = after?.resourceGroup?.toString();
    console.log(`Processing change for resource: ${resName}, Type: ${type}, Location: ${location}, API Version: ${apiVersion}`);
    markdownData.push({ h2: `Resrource Name: ${resName}` }, { code: { language: "text", content: `Resource ID: ${resourceId || 'Unknown Resource ID'}` } }, { h3: `Change Type: ${changeType || 'Unknown Change Type'}` });
    const ulItems = [];
    ulItems.push(`**Name**: **${resName}**`, `Type: ${type}`);
    if (resGroup) {
        ulItems.push(`Resource Group: ${resGroup}`);
    }
    ulItems.push(`Location: ${location}`, `API Version: ${apiVersion}`);
    if (changeType === 'Modify' && delta && Array.isArray(delta)) {
        markdownData.push({ h3: "Change Details" });
        ulItems.push({ ul: [...processDelta(delta)] });
    }
    else if (changeType === 'Create') {
        markdownData.push({ h3: "New Resource Details" });
        ulItems.push({ ul: [...processValue(after)] });
    }
    else {
        markdownData.push({ h3: "Details" });
    }
    ;
    markdownData.push({ ul: ulItems });
    console.log(`Finished processing change for resource: ${resName}`);
    return markdownData;
}
;
function processDelta(delta, parentPath = '') {
    const markdownData = [];
    delta.forEach((change) => {
        const { after, before, children, path, propertyChangeType } = change;
        let fullpath = parentPath ? `${parentPath}${Number.isInteger(Number(path)) ? '[' + path + ']' : '.' + path}` : path;
        markdownData.push(`**Resource Type**: ${fullpath || 'Unknown Resource Type'}`, `Change Type: ${propertyChangeType || 'Unknown Change Type'}`);
        if (after !== undefined && after !== null) {
            const afterVal = [...processValue(after)];
            if (afterVal.length === 1 && typeof afterVal[0] === 'string' && !afterVal[0].includes(':')) {
                markdownData.push(`After: ${afterVal[0]}`);
            }
            else {
                markdownData.push(`After:`, { Ul: [...processValue(after)] });
            }
            ;
        }
        else {
            markdownData.push(`After: null`);
        }
        ;
        if (before !== undefined && before !== null) {
            const beforeVal = [...processValue(before)];
            if (beforeVal.length === 1 && typeof beforeVal[0] === 'string' && !beforeVal[0].includes(':')) {
                markdownData.push(`Before: ${beforeVal[0]}`);
            }
            else {
                markdownData.push(`Before:`, { ul: [...processValue(before)] });
            }
            ;
        }
        else {
            markdownData.push(`Before: null`);
        }
        ;
        if (children && Array.isArray(children) && children.length > 0) {
            markdownData.push({ hr: "" });
            markdownData.push(`**Child Resource(s)**:`, { ul: [...processDelta(children, fullpath)] });
        }
        ;
    });
    return markdownData;
}
;
function processValue(value) {
    const markdownData = [];
    if (Array.isArray(value)) {
        let i = 0;
        value.forEach((item) => {
            if (typeof item === 'object' && item !== null) {
                Object.entries(item).forEach(([key, val]) => {
                    markdownData.push(`${key}: ` + [...processValue(val)]);
                });
            }
            else {
                markdownData.push([...processValue(item)]);
            }
        });
    }
    else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([key, val]) => {
            if (Array.isArray(val)) {
                markdownData.push(`${key}: `, { ul: [...processValue(val)] });
            }
            else {
                markdownData.push(`${key}: `, { ul: [...processValue(val)] });
            }
            ;
        });
    }
    else {
        markdownData.push(`${value !== null && value !== undefined ? value?.toString() : 'N/A'}`);
    }
    ;
    return markdownData;
}
;
