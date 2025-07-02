/**
 * Generates a human-readable report from parsed what-if data.
 * @param parsedData - The structured object from parseWhatIfJson.
 * @returns A Markdown or text summary of planned infrastructure changes.
 */

const json2md = require('json2md');
import * as fs from 'fs';
import * as path from 'path';

export async function generateReport(parsedData: any): Promise<string> {
  // TODO: Implement report generation logic for Azure DevOps Extension
  // Example: Convert parsedData into a Markdown summary
  //return '# Bicep What-If Report\n\n_No changes detected or report logic not implemented yet._';
  //return printParsedDataAsMarkdown(parsedData) as Promise<string>;
  return jsonToMarkdown(parsedData) as Promise<string>;
};

export async function jsonToMarkdown(jsonData: any): Promise<string> {
  const markdownData: any = [{ h1: 'Bicep What-If Report' }];
  console.log(`Generating Markdown report for ${jsonData.changes.length} changes.`);
  jsonData.changes.forEach((change: any) => {
    markdownData.push(...processChange(change));
  });
  
  //const reportRaw: 
  const outputFilePath = path.resolve(__dirname, 'raw.json')
  fs.writeFileSync(outputFilePath, JSON.stringify(markdownData, null, 2), 'utf-8');
  const markdown: string = json2md(markdownData);
  return markdown;
};

function processChange(change: any): any[] {
  const markdownData: any[] = [];
  const {after, changeType, delta, resourceId} = change;
  
  // Add common header fields for each change
  const resName: string = after?.name?.toString() || 'Unnamed Resource';
  const type: string = after?.type?.toString() || 'Unknown Type';
  const location: string = after?.location?.toString() || 'Unknown Location';
  const apiVersion: string = after?.apiVersion?.toString() || 'Unknown API Version';
  const resGroup: string = after?.resourceGroup?.toString();

  console.log(`Processing change for resource: ${resName}, Type: ${type}, Location: ${location}, API Version: ${apiVersion}`);

  markdownData.push(
    { h2: `Resource Name: ${resName}` },
    { code: { language: "text", content: `Resource ID: ${resourceId || 'Unknown Resource ID'}` } },
    { h3: `Change Type: ${changeType || 'Unknown Change Type'}` },
  );

  const ulItems: any[] =[];
  const mainItems: any[] = [];
  //ulItems.push(
  mainItems.push(
    `**Name**: **${resName}**`,
    `Type: ${type}`
  );
  if (resGroup) {
    //ulItems.push(`Resource Group: ${resGroup}`);
    mainItems.push(`Resource Group: ${resGroup}`);
  }
  //ulItems.push(
  mainItems.push(
    `Location: ${location}`,
    `API Version: ${apiVersion}`
  );

  markdownData.push({ ul: mainItems });

  if (changeType === 'Modify' && delta && Array.isArray(delta)) {
    markdownData.push(
      { h3: "Change Details" },
      { ul: [...processDelta(delta)]}
    );
    //ulItems.push({ ul: [...processDelta(delta)] });
  } else if (changeType === 'Create') {
    markdownData.push(
      { h3: "New Resource Details" },
      { ul: [...processValue(after)] }
    );
    //ulItems.push({ ul: [...processValue(after)] });
  } else {
    //TODO: No Changes so just show the details of the resource
    markdownData.push({ h3: "Details" });
  };

  //markdownData.push({ ul: ulItems });

  console.log(`Finished processing change for resource: ${resName}`);
  return markdownData;
};

function processDelta(delta: any[], parentPath: string = ''): any[] {
  const markdownData: any[] = [];

  delta.forEach((change: any) => {
    const { after, before, children, path, propertyChangeType }: any = change;
    const ulItems: any[] = [];
    const chUlIteam: any[] = [];
    let fullpath: string = parentPath ? `${parentPath}${Number.isInteger(Number(path)) ? '[' + path + ']' : '.' + path}` : path;
    
    ulItems.push(`Change Type: ${propertyChangeType || 'Unknown Change Type'}`);
    
    if (after !== undefined  && after !== null) {
      const afterVal: any [] = [...processValue(after)];
      if (afterVal.length === 1 && typeof afterVal[0] === 'string' && !afterVal[0].includes(':')) {
        ulItems.push(`After: ${afterVal[0]}`);
      } else {
        ulItems.push(`After:`, { Ul: afterVal });
      };
    } else {
      ulItems.push(`After: null`);
    };
    if (before !== undefined && before !== null) {
      const beforeVal: any [] = [...processValue(before)];
      if (beforeVal.length === 1 && typeof beforeVal[0] === 'string' && !beforeVal[0].includes(':')) {
        ulItems.push(`Before: ${beforeVal[0]}`);
      } else {
        ulItems.push(`Before:`, { ul: beforeVal });
      };
    } else {
      ulItems.push(`Before: null`);
    };

    if (children && Array.isArray(children) && children.length > 0) {
      //markdownData.push({hr: ""});
      ulItems.push(`**Child Resource(s)**:`, {ul: [...processDelta(children, fullpath)] });
    };

    markdownData.push(
      `**Resource Type**: ${fullpath || 'Unknown Resource Type'}`,
      { ul: ulItems }
    );

  });

  return markdownData;
};

function processValue(value: any): any[] {
  const markdownData: any[] = [];

  if (Array.isArray(value)) {
    let i: number = 0;
    value.forEach((item: any) => {
      if (Array.isArray(item) && item.length === 1) {
        markdownData.push(`Item ${++i}: ${item[0].toString()}`);
      } else if (Array.isArray(item)) {
        markdownData.push(`Item ${++i}: `, { ul: [...processValue(item)] });
      } else if (typeof item === 'object' && item !== null) {
        const ulItems: any[] = [];
        Object.entries(item).forEach(([key, val]) => {
          if (Array.isArray(val) && val.length === 1) {
            ulItems.push(`${key}: ${val[0].toString()}`);
            //markdownData.push(`${key}: ${val[0].toString()}`);
          } else if (Array.isArray(val)) {
            ulItems.push(`${key}: `, { ul: [...processValue(val)] });
            //markdownData.push(`${key}: `, { ul: [...processValue(val)] });
          } else {
            //TODO: Handle nested objects
            ulItems.push(`${key}: ${val}`);
            //markdownData.push(`${key}: ${val}`)
            //markdownData.push(`Item ${++i}:`, { ul: [`${key}: ${val}`] });
          };
        });
        markdownData.push(`Item ${++i}: `, { ul: ulItems });
      } else {
        markdownData.push(`Item ${++i}: ${item.toString()}`);  
      };
    });
  } else if (typeof value === 'object' && value !== null) {
    const ulItems: any[] = [];
    Object.entries(value).forEach(([key, val]) => {
      if (Array.isArray(val) && val.length === 1) {
        ulItems.push(`${key}: ${val[0].toString()}`);
      } else if (Array.isArray(val)) {
        ulItems.push(`${key}: `, { ul: [...processValue(val)] });
      } else {
        ulItems.push(`${key}: `, { ul: [...processValue(val)] });
      };
    });
    markdownData.push( ulItems );
  } else {
    markdownData.push(`${value !== null && value !== undefined ? value?.toString() : 'N/A'}`);
  };

  return markdownData;
};
