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
};

async function printParsedDataAsMarkdown(parsedData: any): Promise<string> {
  const markdownData: any = [];
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
      };
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
          children.push(funcFlattenDelta(delta.children, delta.path));
        };

        const ulItems: any[] = [];
        ulItems.push(
            `Property: ${delta.path || 'Unknown Property'}`,
            `Change Type: ${delta.propertyChangeType || 'Unknown Change Type'}`
        );
        if (delta.after !== null) {
          ulItems.push(`After:`, { ul: [funcBeforeOrAfter(delta.after, delta.path)]});
        } else {
          ulItems.push(`After: null`);
        };
        if (delta.before !== null) {
          ulItems.push(`Before:`, { ul: [funcBeforeOrAfter(delta.before, delta.path)]});
        } else {
          ulItems.push(`Before: null`);
        };
        
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
      const mainItems: string[] = [];
      mainItems.push(`**Resource Type**: ${after.type || 'Unknown Type'}`);
      if(after.resourceGroup) {
        mainItems.push(`**Resource Group**: ${after.resourceGroup || 'Unknown Resource Group'}`);
      };
      mainItems.push(
        `**Location**: ${after.location || 'Unknown Location'}`,
        `**API Version**: ${after.apiVersion || 'Unknown API Version'}`
      );
      markdownData.push({ ul: [ mainItems ]});

      if (after.properties) {
        markdownData.push({ ul:
          [
            `**Properties**:`,
            {ul: [
              funcExplodeProperties(after.properties)
            ]}
          ]}
        );
      }
    } else {
      markdownData.push({ p: "This change type is not handled in the report generation logic. Tell the developer to get his sh*t together!" });
    };
    
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
    });
  });
};

  const markdown: string = json2md(markdownData);
  return markdown;
};

// Recursive function to flatten delta objects and their children
function funcFlattenDelta(deltaArray: any[], parentPath: string = ''): any[] {
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
    const afterItems: any[] = [];
    beforeItems.push(`Before:`, funcBeforeOrAfter(delta.before, delta.path));
    afterItems.push(`After:`, funcBeforeOrAfter(delta.after, delta.path));

    result.push({
      ul: [
        `Subresource: ${fullPath}`,
        {
          ul: [
            `Property: ${fullPath}`,
            `Change Type: ${delta.propertyChangeType}`,
            //`After: ${delta.after}`,
            afterItems,
            //`Before: ${delta.before}`,
            beforeItems
          ]
        }
      ]
  });

    // Recursively process children if present
    if (delta.children && Array.isArray(delta.children)) {
      //console.log('Processing children for path:', fullPath);
      result.push( funcFlattenDelta(delta.children, fullPath));
    };
  };

  return result;
};

function funcBeforeOrAfter(beforeOrAfter: any, path: string = ''): any {
  if (beforeOrAfter && Array.isArray(beforeOrAfter)) {
    console.log('Processing array beforeOrAfter:', path );
    const subItems: any[] = [];
    beforeOrAfter.forEach((element: any) => {
      const subList: any[] = [];
      //Dynamically get all key/value pairs in the object     
      if (Array.isArray(element) || ( typeof element === 'object' && element !== null )) {
        console.log(`Processing array if '${typeof element}' - path:`, path );
        subList.push({ ul: funcBeforeOrAfter(element, path) });
      //} else if (Array.isArray(element)) {
      //  console.log(`Processing array else if 'Array' element[${key}] - path:`, path);
      //  subList.push({ ul: funcBeforeOrAfter(value, key) });
      } else {
        console.log(`Processing array else primitive element '${element} - path:`, path);
        subList.push(element);
      }
      subItems.push([subList]);
      console.log('Finished processing array element:',);
    });
    console.log('Finished processing array beforeOrAfter:', path );
    return ([
      { ul: `${path}:` },
      { ul: [subItems] }
    ]);
  } else if (typeof beforeOrAfter === 'object' && beforeOrAfter !== null) {
    console.log('Processing object beforeOrAfter:', path );
    const subItems: any[] = [];
    const propertyNames = Object.keys(beforeOrAfter);
    propertyNames.forEach(key => {
      const subList: any[] = [];
      if (Array.isArray(beforeOrAfter[key]) || ( typeof beforeOrAfter[key] === 'object' && beforeOrAfter[key] !== null )) {
        console.log(`Processing if for beforeOrAfter[${key}] as '${typeof beforeOrAfter[key]}' - path:`, path )
        subList.push({ ul: funcBeforeOrAfter(beforeOrAfter[key], key) });
      //} else if (Array.isArray(beforeOrAfter[key])) {
      //  console.log(`Processing object else if 'Array' beforeOrAfter[${key}] - path:`, path)
      //  subList.push({ ul: funcBeforeOrAfter(beforeOrAfter[key], key)});
      } else {
        console.log(`Processing object else primitive beforeOrAfter[${key}] - path:`, path)
        subList.push(`${key}: ${beforeOrAfter[key]}`);
      };
      console.log('Finished processing object property:', key);
      subItems.push(subList);
    });
    console.log('Finished processing object beforeOrAfter:', path );
    return subItems;
  } else {
    console.log('Processing primitive beforeOrAfter:', path );
    return `${beforeOrAfter}`;
  };
};

function funcExplodeProperties(properties: any): any {
  const result: any[] = [];
  if (typeof properties === 'object' && properties !== null) {
    const propertyNames = Object.keys(properties);
    propertyNames.forEach(key => {
      if (typeof properties[key] === 'object' && properties[key] !== null) {
        console.log('Exploding nested properties for key:', key);
        const subItems: any[] = [];
        const propertyNames = Object.keys(properties[key]);
        propertyNames.forEach(key => {
          const subValues: any[] = [];
          if (Array.isArray(properties[key]) || typeof properties[key] === 'object') {
            subValues.push({ ul: funcExplodeProperties(properties[key])});
          } else {
            subValues.push(`${key}: ${properties[key]}`);
          };
          subItems.push({ ul: subValues });
        });
        result.push({ ul: subItems });
      } else if (properties[key] && Array.isArray(properties[key])) {
        console.log('Property:', key, 'Value:', properties[key]);
        const subValues: any[] = [];
        const propertyArray: any[] = properties[key];
        propertyArray.forEach((value: any) => {
          subValues.push(`${key}: ${value}`);
        });
        result.push({ ul: subValues });
        //properties[key].forEach((value: any) => {
        //  result.push(`${key}: ${value}`)
      };
    });

  } else {
    result.push("Properties are not an object!");
  };
  return result;
}