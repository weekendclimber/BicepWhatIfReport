"use strict";
/**
 * Generates a human-readable report from parsed what-if data.
 * @param parsedData - The structured object from parseWhatIfJson.
 * @returns A Markdown or text summary of planned infrastructure changes.
 */
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
exports.generateReport = generateReport;
exports.jsonToMarkdown = jsonToMarkdown;
const json2md = require('json2md');
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
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
    // TODO: Implement diagnostics section if available
    jsonData.diagnostics?.forEach((diag) => {
        const diagMarkdown = [];
        diagMarkdown.push({ h2: `Diagnostic Code: ${diag.code}` }, { h3: `Severity: ${diag.level || 'Unknown Level'}` }, { code: { language: "text", content: `Resource ID: ${diag.target || 'Unknown Resource ID'}` } }, { p: `**Message**: ${diag.message || 'Unknown Message'}` });
        if (diag.additionalInfo !== null && diag.additionalInfo !== undefined) {
            diagMarkdown.push({ p: `**Additional Info**: ${diag.additionalInfo}` });
        }
        ;
        markdownData.push(...diagMarkdown);
    });
    //const reportRaw: 
    const outputFilePath = path.resolve(__dirname, 'raw.json');
    fs.writeFileSync(outputFilePath, JSON.stringify(markdownData, null, 2), 'utf-8');
    const markdown = json2md(markdownData);
    return markdown;
}
;
function processChange(change) {
    const markdownData = [];
    const mainItems = [];
    const { after, changeType, delta, resourceId } = change;
    // Add common header fields for each change
    const resName = after?.name?.toString() || 'Unnamed Resource';
    const type = after?.type?.toString() || 'Unknown Type';
    const location = after?.location?.toString() || 'Unknown Location';
    const apiVersion = after?.apiVersion?.toString() || 'Unknown API Version';
    const resGroup = after?.resourceGroup?.toString();
    console.log(`Processing change for resource: ${resName}, Type: ${changeType}, Location: ${location}, API Version: ${apiVersion}`);
    markdownData.push({ h2: `Resource Name: ${resName}` }, { code: { language: "text", content: `Resource ID: ${resourceId || 'Unknown Resource ID'}` } }, { h3: `Change Type: ${changeType || 'Unknown Change Type'}` });
    mainItems.push(`**Name**: **${resName}**`, `Type: ${type}`);
    if (resGroup) {
        mainItems.push(`Resource Group: ${resGroup}`);
    }
    mainItems.push(`Location: ${location}`, `API Version: ${apiVersion}`);
    markdownData.push({ ul: mainItems });
    if (changeType === 'Modify' && delta && Array.isArray(delta)) {
        console.log('Processing a Modify change with delta.');
        markdownData.push({ h3: "Change Details" }, { ul: [...processDelta(delta)] });
    }
    else if (changeType === 'Create') {
        console.log('Processing a Create change.');
        if (after && after.properties) {
            markdownData.push({ h3: "New Resource Details" }, { ul: [...processProperties(after.properties)] });
        }
        ;
    }
    else if (changeType === 'Unsupported') {
        console.log('Processing an Unsupported change.');
        markdownData.push({ h3: "Unsupported Change" }, { p: `**Reason**: ${change.unsupportedReason}` });
        if (after && after.properties) {
            markdownData.push({ h3: "Resource Properties" }, { ul: [...processProperties(after.properties)] });
        }
        ;
    }
    else if (changeType === 'Ignore' || changeType === 'NoChange') {
        //TODO: No Changes so just show the details of the resource
        console.log('No changes detected or change ignored.');
        markdownData.push({ h3: "Details" });
        if (changeType === 'Ignore') {
            console.log('Processing an Ignored change.');
            markdownData.pop(); // Remove the Details header
            markdownData.push({ p: `**Ignored Change**` });
        }
        else {
            console.log('Processing a NoChange change.');
            if (after && after.properties) {
                markdownData.push({ ul: [...processProperties(after.properties)] });
            }
            else {
                //Remove the Details header
                markdownData.pop();
            }
        }
    }
    else {
        console.log(`Processing an unknown or unimplemented change type: ${changeType}`);
        markdownData.push({ h3: "Unknown Change Type" }, { p: `Change type "${changeType}" is not recognized or not implemented.` });
    }
    ;
    console.log(`Finished processing change for resource: ${resName}`);
    return markdownData;
}
;
function processDelta(delta, parentPath = '') {
    const markdownData = [];
    delta.forEach((change) => {
        const { after, before, children, path, propertyChangeType } = change;
        const ulItems = [];
        const chUlIteam = [];
        let fullpath = parentPath ? `${parentPath}${Number.isInteger(Number(path)) ? '[' + path + ']' : '.' + path}` : path;
        ulItems.push(`Change Type: ${propertyChangeType || 'Unknown Change Type'}`);
        ulItems.push([...processBeforeAfter(after, 'After')]);
        ulItems.push([...processBeforeAfter(before, 'Before')]);
        //if (after !== undefined  && after !== null) {
        //  const afterVal: any [] = [...processValue(after)];
        //  if (afterVal.length === 1 && typeof afterVal[0] === 'string' && !afterVal[0].includes(':')) {
        //    ulItems.push(`After: ${afterVal[0]}`);
        //  } else {
        //    ulItems.push(`After:`, { Ul: afterVal });
        //  };
        //} else {
        //  ulItems.push(`After: null`);
        //};
        //
        //if (before !== undefined && before !== null) {
        //  const beforeVal: any [] = [...processValue(before)];
        //  if (beforeVal.length === 1 && typeof beforeVal[0] === 'string' && !beforeVal[0].includes(':')) {
        //    ulItems.push(`Before: ${beforeVal[0]}`);
        //  } else {
        //    ulItems.push(`Before:`, { ul: beforeVal });
        //  };
        //} else {
        //  ulItems.push(`Before: null`);
        //};
        if (children && Array.isArray(children) && children.length > 0) {
            ulItems.push(`**Child Resource(s)**:`, { ul: [...processDelta(children, fullpath)] });
        }
        ;
        markdownData.push(`**Resource Type**: ${fullpath || 'Unknown Resource Type'}`, { ul: ulItems });
    });
    return markdownData;
}
;
function processBeforeAfter(thing, what = '') {
    const markdownData = [...processValue(thing)];
    if (thing !== undefined && thing !== null) {
        if (thing.length === 1 && typeof thing[0] === 'string' && !thing[0].includes(':')) {
            markdownData.push(`${what}: ${thing[0].toString()}`);
        }
        else {
            markdownData.push(`${what}: `, { ul: markdownData });
        }
        ;
    }
    else {
        markdownData.push(`${what}: null`);
    }
    ;
    return markdownData;
}
function processValue(value) {
    const markdownData = [];
    if (Array.isArray(value)) {
        let i = 0;
        value.forEach((item) => {
            if (Array.isArray(item) && item.length === 1 && typeof item[0] !== 'object') {
                markdownData.push(`Item ${++i}: ${item[0].toString()}`);
            }
            else if (Array.isArray(item)) {
                markdownData.push(`Item ${++i}: `, { ul: [...processValue(item)] });
            }
            else if (typeof item === 'object' && item !== null) {
                const ulItems = [];
                Object.entries(item).forEach(([key, val]) => {
                    if (Array.isArray(val) && val.length === 1) {
                        ulItems.push(`${key}: ${val[0].toString()}`);
                    }
                    else if (typeof val === 'string' || typeof val === 'boolean' || typeof val === 'number') {
                        ulItems.push(`${key}: ${val.toString()}`);
                    }
                    else {
                        ulItems.push(`${key}: `, { ul: [...processValue(val)] });
                    }
                    ;
                });
                markdownData.push(`Item ${++i}: `, { ul: ulItems });
            }
            else {
                markdownData.push(`Item ${++i}: ${item.toString()}`);
            }
            ;
        });
    }
    else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([key, val]) => {
            if (Array.isArray(val) && val.length === 1) {
                markdownData.push(`${key}: ${val[0].toString()}`);
            }
            else if (typeof val === 'string' || typeof val === 'boolean' || typeof val === 'number') {
                markdownData.push(`${key}: ${val.toString()}`);
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
function processProperties(properties) {
    const markdownData = [];
    Object.entries(properties).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length === 1 && typeof value[0] !== 'object') {
            markdownData.push(`${key}: ${value[0].toString()}`);
        }
        else if (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') {
            markdownData.push(`${key}: ${value}`);
        }
        else {
            markdownData.push(`${key}: `, { ul: [...processValue(value)] });
        }
        ;
    });
    return markdownData;
}
