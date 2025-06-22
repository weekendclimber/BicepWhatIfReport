/**
 * Generates a human-readable report from parsed what-if data.
 * @param parsedData - The structured object from parseWhatIfJson.
 * @returns A Markdown or text summary of planned infrastructure changes.
 */

const json2md = require('json2md');

export async function generateReport(parsedData: any): Promise<string> {
  // TODO: Implement report generation logic for Azure DevOps Extension
  // Example: Convert parsedData into a Markdown summary
  //return '# Bicep What-If Report\n\n_No changes detected or report logic not implemented yet._';
  return printParsedDataAsMarkdown(parsedData) as Promise<string>;
}

async function printParsedDataAsMarkdown(parsedData: any): Promise<string> {
  const markdownData: any = []
  markdownData.push({ h1: 'Bicep What-If Report' });

  parsedData.changes.forEach((change: any) => {
    //Note: The following fields are always null or empty in the parsedData:
    // deploymentId
    // identifiers
    // sympbolicname
    // unsupportedReason
    
    // Get the before and after states: note before could be null
    const after = change.after || {};
    const before = change.before || {};

    // Get the common header fields for each change
    markdownData.push(
      { h2: `Resource: ${after.name || 'Unnamed Resource'}` },
      {code: { language: "text", content: `Resource ID: ${change.resourceId || 'Unknown Resource ID'}` } },
      { h3: `Change Type: ${change.changeType}` }
    );

    // If change.ChangeType is 'NoChange' or 'Ignore', we can handle them the same way
    if (change.changeType === 'NoChange' || change.changeType === 'Ignore') {
      //No change:
      // before and after are the same
      // delta is empty
      // resourceId is present
      markdownData.push({ h4: `**Details**` });

      const ulItems: string[] = [];
      ulItems.push(
        `**Name**: **${after.name || 'Unknown Name'}**`,
        `Type: ${after.type || 'Unknown Type'}`,
        `Location: ${after.location || 'Unknown Location'}`
      );
      if (after.resourceGroup) {
        ulItems.push(`Resource Group: ${after.resourceGroup || 'Unknown Resource Group'}`);
      }
      ulItems.push(
        `API Version: ${after.apiVersion || 'Unknown API Version'}`,
        `Resource ID: ${after.resourceId || 'Unknown Resource ID'}`
      );
      markdownData.push({ ul: ulItems });

    } else if (change.changeType === 'Modify') {
      //Modify:
      // before and after are different
      // delta is present and lists the changes
      // resourceId is present
      change.delta.forEach((delta: any) => {
        const children: any [] = [];
        if (delta.children && Array.isArray(delta.children)) {
          children.push(flattenDelta(delta.children, delta.path));
        }

        const ulItems: string[] = [];
        ulItems.push(
            `Property: ${delta.path || 'Unknown Property'}`,
            `Before: ${delta.before || 'N/A'}`,
            `After: ${delta.after || 'N/A'}`,
            `Change Type: ${delta.propertyChangeType || 'Unknown Change Type'}`
        );
        
        markdownData.push(
            { h4: `**Change Details**`},
            { ul: ulItems },
            children
        );
      });
    } else if (change.changeType === 'Create') {
      //Create:
      // before is null
      // after is present
      // delta is null
      // resourceId is present
    }
    
    markdownData.push({ hr: "" });
  }
);

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

// Recursive function to flatten delta objects and their children
function flattenDelta(deltaArray: any[], parentPath: string = ''): any[] {
  if (!deltaArray) return [];
  let result: any[] = [];

  for (const delta of deltaArray) {
    // Build the full path for nested properties
    const isInt = Number.isInteger(Number(delta.path));
    const pathSegment = isInt ? `[${delta.path}]` : `${delta.path}`;
    const fullPath = parentPath
      ? `${parentPath}${isInt ? pathSegment : '.' + delta.path}`
      : parentPath;

    // Add the current delta with its full path
    const beforeItems: any[] = [];
    if (delta.before && Array.isArray(delta.before)) {
      const subItems: string[] = [];
      delta.before.forEach((element: any) => {
        // Dynamically get all key/value pairs in the object
        Object.entries(element).forEach(([key, value]) => {
          subItems.push(`${key}: ${value}`);
        });
      });
      beforeItems.push(`Before:`, { ul: subItems });
    } else if (typeof delta.before === 'object' && delta.before !== null) {
      const subItems: any[] = [];
      const propertyNames = Object.keys(delta.before);
      propertyNames.forEach(key => {
        const subValues: any[] = [];
        delta.before[key].forEach((value: any) => {
          subValues.push(`${value}`);
        })
        subItems.push( `${key}:`, { ul: subValues})
      })
      beforeItems.push(`Before:`, { ul: subItems });
    } else {
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
      result.push( flattenDelta(delta.children, fullPath));
    }
  }

  return result;
}