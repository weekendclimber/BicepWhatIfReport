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
    console.log(`Processing change for resource: ${resName}, Type: ${type}, Location: ${location}, API Version: ${apiVersion}`);
    const nestedList = [];
    const nestedHeader = [];
    if (changeType === 'Modify' && delta && Array.isArray(delta)) {
        nestedHeader.push({ h4: 'Change Details' });
        nestedList.push(...processDelta(delta, 1));
    }
    else if (changeType === 'Create') {
        nestedHeader.push({ h4: 'New Resource Details' });
        nestedList.push(...processValue(after, 1));
    }
    ;
    markdownData.push({ h2: `Resource Name: ${resName}` }, { code: { language: "text", content: `Resource ID: ${resourceId || 'Unknown Resource ID'}` } }, { h3: `Change Type: ${changeType || 'Unknown Change Type'}` }, { h4: `Details` }, { ul: [
            `**Name**: ${resName}`,
            `Type: ${type}`,
            `Location: ${location}`,
            `API Version: ${apiVersion}`,
            nestedHeader,
            { ul: nestedList }
        ] });
    console.log(`Finished processing change for resource: ${resName}`);
    return markdownData;
}
;
function processDelta(delta, level) {
    const markdownData = [];
    delta.forEach((change) => {
        const { after, before, children, path, propertyChangeType } = change;
        markdownData.push(`Resource Type: ${path || 'Unknown Resource Type'}`, `Change Type: ${propertyChangeType || 'Unknown Change Type'}`);
        if (after !== undefined && after !== null) {
            markdownData.push(`After:` + [...processValue(after, level + 1)]);
        }
        ;
        if (before !== undefined && before !== null) {
            markdownData.push(`Before:` + [...processValue(before, level + 1)]);
        }
        ;
        if (children && Array.isArray(children) && children.length > 0) {
            markdownData.push(`Child Resource(s):` + [...processDelta(children, level + 1)]);
        }
        ;
    });
    return markdownData;
}
;
function processValue(value, level) {
    const markdownData = [];
    if (Array.isArray(value)) {
        value.forEach((item, index) => {
            markdownData.push(`Item ${index + 1}:` + [...processValue(item, level + 1)]);
        });
    }
    else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([key, val]) => {
            markdownData.push(`${key}:` + [...processValue(val, level + 1)]);
        });
    }
    else {
        markdownData.push(`${value !== null && value !== undefined ? value?.toString() : 'N/A'}`);
    }
    ;
    return markdownData;
}
;
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
        const resName = after.name.toString() || null;
        const chgType = change.changeType.toString() || null;
        // Get the common header fields for each change
        markdownData.push({ h2: `Resource: ${resName || 'Unnamed Resource'}` }, { code: { language: "text", content: `Resource ID: ${change.resourceId || 'Unknown Resource ID'}` } }, { h3: `Change Type: ${chgType}` });
        console.log(`${resName}: Processing change type '${change.changeType}'`);
        ///////NO CHANGE or IGNORE LOGIC//////
        // If change.ChangeType is 'NoChange' or 'Ignore', we can handle them the same way
        if (chgType === 'NoChange' || chgType === 'Ignore') {
            //No change:
            // before and after are the same
            // delta is empty
            // resourceId is present
            console.log(`${resName}: Change type is '${chgType}'. No detailed changes to report. Showing existing resource details.`);
            markdownData.push({ h4: `**Details**` });
            const ulItems = [];
            ulItems.push(`**Name**: **${after.name || 'Unknown Name'}**`, `Type: ${after.type || 'Unknown Type'}`, `Location: ${after.location || 'Unknown Location'}`);
            if (after.resourceGroup) {
                ulItems.push(`Resource Group: ${after.resourceGroup || 'Unknown Resource Group'}`);
            }
            ;
            ulItems.push(`API Version: ${after.apiVersion || 'Unknown API Version'}`, `Resource ID: ${after.resourceId || 'Unknown Resource ID'}`);
            markdownData.push({ ul: ulItems });
            ///////MODIFY LOGIC//////
        }
        else if (chgType === 'Modify') {
            console.log(`${resName}: Change type is '${chgType}'. Processing ${change.delta.length} detailed change(s).`);
            //Modify:
            // before and after are different
            // delta is present and lists the changes
            // resourceId is present
            change.delta.forEach((delta) => {
                let i = 0;
                const ulItems = [];
                console.log(`${resName}: Processing delta change #${++i} for property path '${delta.path}'.`);
                //const children: any [] = [];
                ulItems.push(`Property: ${delta.path || 'Unknown Property'}`, `Change Type: ${delta.propertyChangeType || 'Unknown Change Type'}`);
                if (Array.isArray(delta.after) || (typeof delta.after === 'object' && delta.after !== null)) {
                    console.log(`${resName}: 'After' property for '${delta.path}' is complex type '${typeof delta.after}'. Processing...`);
                    ulItems.push(`After:` + [funcBeforeOrAfter(delta.after, delta.path)]);
                }
                else {
                    console.log(`${resName}: 'After' property for '${delta.path}' is primitive type '${typeof delta.after}'. Pushing to 'ulItmes'...`);
                    ulItems.push(`After: ${delta.after}`);
                }
                ;
                if (Array.isArray(delta.before) || (typeof delta.before === 'object' && delta.before !== null)) {
                    console.log(`${resName}: 'Before' property for '${delta.path}' is complex type '${typeof delta.before}'. Processing...`);
                    ulItems.push(`Before:` + [funcBeforeOrAfter(delta.before, delta.path)]);
                }
                else {
                    console.log(`${resName}: 'Before' property for '${delta.path}' is primitive type '${typeof delta.before}'. Pushing to 'ulItmes'...`);
                    ulItems.push(`Before: ${delta.before}`);
                }
                ;
                //if (children.length > 0) {
                //  ulItems.push({ ul: children});
                //};
                if (delta.children && Array.isArray(delta.children)) {
                    console.log(`${resName}: Delta has '${delta.children.length}' child(ren). Processing children.`);
                    ulItems.push({ h4: "Child Resource(s)" }, funcDeltaChild(delta.children, delta.path));
                    //ulItems.push( { h4: "Child Resource(s)" }, );
                }
                ;
                markdownData.push({ h4: `**Change Details**` }, { ul: ulItems });
            });
            ////////CREATE LOGIC//////
        }
        else if (change.changeType === 'Create') {
            console.log(`Change type is '${chgType}' for '${resName}'. Processing new resource details.`);
            //Create:
            // before is null
            // after is present
            // delta is null
            // resourceId is present
            const mainItems = [];
            mainItems.push(`**Resource Type**: ${after.type || 'Unknown Type'}`);
            if (after.resourceGroup) {
                mainItems.push(`**Resource Group**: ${after.resourceGroup || 'Unknown Resource Group'}`);
            }
            ;
            mainItems.push(`**Location**: ${after.location || 'Unknown Location'}`, `**API Version**: ${after.apiVersion || 'Unknown API Version'}`);
            markdownData.push({ ul: [mainItems] });
            if (after.properties) {
                markdownData.push({ ul: [
                        `**Properties**:`,
                        { ul: [
                                funcExplodeProperties(after.properties)
                            ] }
                    ] });
            }
            ////////UNKNOWN CHANGE TYPE LOGIC//////
        }
        else {
            markdownData.push({ p: "This change type is not handled in the report generation logic. Tell the developer to get his sh*t together!" });
        }
        ;
        markdownData.push({ hr: "" });
    });
    if (parsedData.diagnostics) {
        console.log(`There are '${parsedData.diagnostics.length}' diagnostic(s) to report. Processing...`);
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
    ;
    const markdown = json2md(markdownData);
    return markdown;
}
;
// Recursive function to flatten delta children arrays and their children
// Each child has an array of object with:
//  after
//  before
//  children
//  path
//  propertyChangeType
function funcDeltaChild(deltaArray, parentPath = '') {
    if (!deltaArray) {
        console.log('No deltaArray provided, returning empty array.');
        return [];
    }
    else {
        console.log(`There are '${deltaArray.length}' delta child(ren) to process for parent path: '${parentPath}'`);
    }
    let result = [];
    deltaArray.forEach((child) => {
        // Build the full path for nested properties
        const fullPath = `${parentPath}${Number.isInteger(Number(child.path))
            ? '[' + child.path + ']' : '.' + child.path}`;
        console.log(`Processing child with path: '${fullPath}' and change type: '${child.propertyChangeType}'`);
        const ulItems = [];
        ulItems.push(`Property: ${fullPath}`, `Change Type: ${child.propertyChangeType}`);
        // Add the current child with its full path
        if (Array.isArray(child.before) || (typeof child.before === 'object' && child.before !== null)) {
            console.log(`The 'Before' property for '${fullPath}' is a complex type. Processing...`);
            ulItems.push(`Before:`, +[funcBeforeOrAfter(child.before, child.path)]);
        }
        else {
            console.log(`The 'Before' property for '${fullPath}' is a primitive type. Pushing to 'ulItems'...`);
            ulItems.push(`Before: ${child.before}`);
        }
        ;
        if (Array.isArray(child.after) || (typeof child.after === 'object' && child.after !== null)) {
            console.log(`The 'After' property for '${fullPath}' is a complex type. Processing...`);
            ulItems.push(`After:`, +[funcBeforeOrAfter(child.after, child.path)]);
        }
        else {
            console.log(`The 'After' property for '${fullPath}' is a primitive type. Pushing to 'ulItems'...`);
            ulItems.push(`After: ${child.after}`);
        }
        ;
        // Recursively process children if present
        if (child.children && Array.isArray(child.children)) {
            console.log(`The 'Children' property for '${fullPath}' has ${child.children.length} child(ren). Processing...`);
            ulItems.push({ h4: "Child Resource(s)" }, { ul: funcDeltaChild(child.children, fullPath) });
        }
        ;
        result.push(ulItems);
    });
    return result;
}
;
function funcBeforeOrAfter(beforeOrAfter, path = '') {
    if (beforeOrAfter && Array.isArray(beforeOrAfter)) {
        console.log(`Processing '${beforeOrAfter.length}' items in beforeOrAfter array in funcBeforeOrAfter for path '${path}'.`);
        const subItems = [];
        beforeOrAfter.forEach((element) => {
            const subList = [];
            //Dynamically get all key/value pairs in the object     
            if (Array.isArray(element) || (typeof element === 'object' && element !== null)) {
                console.log(`Recursing 'element' of type '${typeof element}' within path '${path}'`);
                subList.push({ ul: funcBeforeOrAfter(element, path) });
                //} else if (Array.isArray(element)) {
                //  console.log(`Processing array else if 'Array' element[${key}] - path:`, path);
                //  subList.push({ ul: funcBeforeOrAfter(value, key) });
            }
            else {
                console.log(`Processing primitive 'element' of type '${typeof element}' with the value of '${element}' within path '${path}'`);
                subList.push(element);
            }
            subItems.push([subList]);
            console.log(`Finished processing 'element' of type '${typeof element}' in path '${path}'`);
        });
        console.log('Finished processing array beforeOrAfter:', path);
        return ([
            { ul: `${path}:` },
            { ul: [subItems] }
        ]);
    }
    else if (typeof beforeOrAfter === 'object' && beforeOrAfter !== null) {
        console.log(`Processing object beforeOrAfter in funcBeforeOrAfter for path '${path}'`);
        const subItems = [];
        const propertyNames = Object.keys(beforeOrAfter);
        propertyNames.forEach(key => {
            const subList = [];
            if (typeof beforeOrAfter[key] === 'object' && beforeOrAfter[key] !== null) {
                console.log(`Processing object for beforeOrAfter[${key}] as '${typeof beforeOrAfter[key]}' - path:`, path);
                subList.push({ ul: funcBeforeOrAfter(beforeOrAfter[key], key) });
            }
            else if (Array.isArray(beforeOrAfter[key])) {
                console.log(`Processing array else if 'Array' beforeOrAfter[${key}] - path:`, path);
                subList.push({ ul: funcBeforeOrAfter(beforeOrAfter[key], key) });
            }
            else {
                console.log(`Processing object else primitive beforeOrAfter[${key}] - path:`, path);
                subList.push(`${key}: ${beforeOrAfter[key]}`);
            }
            ;
            console.log('Finished processing object property:', key);
            subItems.push(subList);
        });
        console.log('Finished processing object beforeOrAfter:', path);
        return subItems;
    }
    else {
        console.log('Processing primitive beforeOrAfter:', path);
        return `${beforeOrAfter}`;
    }
    ;
}
;
function funcExplodeProperties(properties) {
    const result = [];
    if (typeof properties === 'object' && properties !== null) {
        const propertyNames = Object.keys(properties);
        propertyNames.forEach(key => {
            if (typeof properties[key] === 'object' && properties[key] !== null) {
                console.log('Exploding nested properties for key:', key);
                const subItems = [];
                const propertyNames = Object.keys(properties[key]);
                propertyNames.forEach(key => {
                    const subValues = [];
                    if (Array.isArray(properties[key]) || typeof properties[key] === 'object') {
                        subValues.push({ ul: funcExplodeProperties(properties[key]) });
                    }
                    else {
                        subValues.push(`${key}: ${properties[key]}`);
                    }
                    ;
                    subItems.push({ ul: subValues });
                });
                result.push({ ul: subItems });
            }
            else if (properties[key] && Array.isArray(properties[key])) {
                console.log('Property:', key, 'Value:', properties[key]);
                const subValues = [];
                const propertyArray = properties[key];
                propertyArray.forEach((value) => {
                    subValues.push(`${key}: ${value}`);
                });
                result.push({ ul: subValues });
                //properties[key].forEach((value: any) => {
                //  result.push(`${key}: ${value}`)
            }
            ;
        });
    }
    else {
        result.push("Properties are not an object!");
    }
    ;
    return result;
}
