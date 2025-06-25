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
  //return printParsedDataAsMarkdown(parsedData) as Promise<string>;
  return jsonToMarkdown(parsedData) as Promise<string>;
};

export async function jsonToMarkdown(jsonData: any): Promise<string> {
  const markdownData: any = [{ h1: 'Bicep What-If Report' }];
  console.log(`Generating Markdown report for ${jsonData.changes.length} changes.`);
  jsonData.changes.forEach((change: any) => {
    markdownData.push(...processChange(change));
  });
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

  const ulItems: any[] =[];
  ulItems.push(
    `**Name**: **${resName}**`,
    `Type: ${type}`
  );
  if (resGroup) {
    ulItems.push(`Resource Group: ${resGroup}`);
  }
  ulItems.push(
    `Location: ${location}`,
    `API Version: ${apiVersion}`
  );

  if (changeType === 'Modify' && delta && Array.isArray(delta)) {
    ulItems.push( '**Change Details**' );
    ulItems.push({ ul: [...processDelta(delta)] });
  } else if (changeType === 'Create') {
    ulItems.push( '**New Resource Details**' );
    ulItems.push({ ul: [...processValue(after)] });
  };

  markdownData.push(
    {h2: `Resource Name: ${resName}`},
    {code: { language: "text", content: `Resource ID: ${resourceId || 'Unknown Resource ID'}` }},
    {h3: `Change Type: ${changeType || 'Unknown Change Type'}`},
    {h4: `Details`},
    {ul: ulItems}
  );
  console.log(`Finished processing change for resource: ${resName}`);
  return markdownData;
};

function processDelta(delta: any[], parentPath: string = ''): any[] {
  const markdownData: any[] = [];

  delta.forEach((change: any) => {
    const { after, before, children, path, propertyChangeType }: any = change;
    let fullpath: string = parentPath ? `${parentPath}${Number.isInteger(Number(path)) ? '[' + path + ']' : '.' + path}` : path;
    
    markdownData.push(
      `**Resource Type**: ${fullpath || 'Unknown Resource Type'}`,
      `Change Type: ${propertyChangeType || 'Unknown Change Type'}`,
    );
    
    if (after !== undefined  && after !== null) {
      const afterVal: any [] = [...processValue(after)];
      if (afterVal.length === 1 && typeof afterVal[0] === 'string' && !afterVal[0].includes(':')) {
        markdownData.push(`After: ${afterVal[0]}`);
      } else {
        markdownData.push(`After:`, { Ul: [...processValue(after)] });
      };
    } else {
      markdownData.push(`After: null`);
    };
    if (before !== undefined && before !== null) {
      const beforeVal: any [] = [...processValue(before)];
      if (beforeVal.length === 1 && typeof beforeVal[0] === 'string' && !beforeVal[0].includes(':')) {
        markdownData.push(`Before: ${beforeVal[0]}`);
      } else {
        markdownData.push(`Before:`, { ul: [...processValue(before)] });
      };
    } else {
      markdownData.push(`Before: null`);
    };

    if (children && Array.isArray(children) && children.length > 0) {
      markdownData.push({hr: ""});
      markdownData.push(`**Child Resource(s)**:`, {ul: [...processDelta(children, fullpath)] });
    };
  });

  return markdownData;
};

function processValue(value: any): any[] {
  const markdownData: any[] = [];

  if (Array.isArray(value)) {
    let i: number = 0;
    value.forEach((item: any) => {
      if (typeof item === 'object' && item !== null) {
        Object.entries(item).forEach(([key, val]) => {
          markdownData.push(`${key}: ` + [...processValue(val)]);
        });
      } else {
        markdownData.push([...processValue(item)]);
      }
    });
  } else if (typeof value === 'object' && value !== null) {
    Object.entries(value).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        markdownData.push(`${key}: `, { ul: [...processValue(val)] });
      } else {
        markdownData.push(`${key}: `, { ul: [...processValue(val)] });
      };
    });
  } else {
    markdownData.push(`${value !== null && value !== undefined ? value?.toString() : 'N/A'}`);
  };

  return markdownData;
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
    const resName: string = after.name.toString() || null;
    const chgType: string = change.changeType.toString() || null;

    // Get the common header fields for each change
    markdownData.push(
      { h2: `Resource: ${resName || 'Unnamed Resource'}` },
      {code: { language: "text", content: `Resource ID: ${change.resourceId || 'Unknown Resource ID'}` } },
      { h3: `Change Type: ${chgType}` }
    );

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

    ///////MODIFY LOGIC//////
    } else if (chgType === 'Modify') {
      console.log(`${resName}: Change type is '${chgType}'. Processing ${change.delta.length} detailed change(s).`);
      //Modify:
      // before and after are different
      // delta is present and lists the changes
      // resourceId is present
      change.delta.forEach((delta: any) => {
        let i: number = 0;
        const ulItems: any[] = [];
        console.log(`${resName}: Processing delta change #${++i} for property path '${delta.path}'.`);
        //const children: any [] = [];

        ulItems.push(
            `Property: ${delta.path || 'Unknown Property'}`,
            `Change Type: ${delta.propertyChangeType || 'Unknown Change Type'}`
        );
        if (Array.isArray(delta.after) || ( typeof delta.after === 'object' && delta.after !== null )) {
          console.log(`${resName}: 'After' property for '${delta.path}' is complex type '${typeof delta.after}'. Processing...`);
          ulItems.push(`After:` + [funcBeforeOrAfter(delta.after, delta.path)]);
        } else {
          console.log(`${resName}: 'After' property for '${delta.path}' is primitive type '${typeof delta.after}'. Pushing to 'ulItmes'...`);
          ulItems.push(`After: ${delta.after}`);
        };
        
        if (Array.isArray(delta.before) || ( typeof delta.before === 'object' && delta.before !== null )) {
          console.log(`${resName}: 'Before' property for '${delta.path}' is complex type '${typeof delta.before}'. Processing...`);
          ulItems.push(`Before:` + [funcBeforeOrAfter(delta.before, delta.path)]);
        } else {
          console.log(`${resName}: 'Before' property for '${delta.path}' is primitive type '${typeof delta.before}'. Pushing to 'ulItmes'...`);
          ulItems.push(`Before: ${delta.before}`);
        };

        //if (children.length > 0) {
        //  ulItems.push({ ul: children});
        //};

        if (delta.children && Array.isArray(delta.children)) {
          console.log(`${resName}: Delta has '${delta.children.length}' child(ren). Processing children.`);
          ulItems.push(
              { h4: "Child Resource(s)" },
              funcDeltaChild(delta.children, delta.path)
          );
          //ulItems.push( { h4: "Child Resource(s)" }, );
        };

        markdownData.push(
            { h4: `**Change Details**`},
            { ul: ulItems },
            //children
        );
      });
    
    ////////CREATE LOGIC//////
    } else if (change.changeType === 'Create') {
      console.log(`Change type is '${chgType}' for '${resName}'. Processing new resource details.`);
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
    
    ////////UNKNOWN CHANGE TYPE LOGIC//////
    } else {
      markdownData.push({ p: "This change type is not handled in the report generation logic. Tell the developer to get his sh*t together!" });
    };
    
    markdownData.push({ hr: "" });
  }
);

if (parsedData.diagnostics) {
  console.log(`There are '${parsedData.diagnostics.length}' diagnostic(s) to report. Processing...`);
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

// Recursive function to flatten delta children arrays and their children
// Each child has an array of object with:
//  after
//  before
//  children
//  path
//  propertyChangeType
function funcDeltaChild(deltaArray: any[], parentPath: string = ''): any[] {
  if (!deltaArray) {
    console.log('No deltaArray provided, returning empty array.');
    return [];
  } else {
    console.log(`There are '${deltaArray.length}' delta child(ren) to process for parent path: '${parentPath}'`);
  }

  let result: any[] = [];

  deltaArray.forEach((child: any) => {
    // Build the full path for nested properties
    const fullPath = `${parentPath}${
      Number.isInteger(Number(child.path))
        ? '[' + child.path + ']' : '.' + child.path}`;

    console.log(`Processing child with path: '${fullPath}' and change type: '${child.propertyChangeType}'`);
    
    const ulItems: any[] = [];
    ulItems.push(
      `Property: ${fullPath}`,
      `Change Type: ${child.propertyChangeType}`
    )

    // Add the current child with its full path
    if (Array.isArray(child.before) || ( typeof child.before === 'object' && child.before !== null )) {
      console.log(`The 'Before' property for '${fullPath}' is a complex type. Processing...`);
      ulItems.push(`Before:`, + [funcBeforeOrAfter(child.before, child.path)] );
    } else {
      console.log(`The 'Before' property for '${fullPath}' is a primitive type. Pushing to 'ulItems'...`);
      ulItems.push(`Before: ${child.before}`);
    };
    if (Array.isArray(child.after) || ( typeof child.after === 'object' && child.after !== null )) {
      console.log(`The 'After' property for '${fullPath}' is a complex type. Processing...`);
      ulItems.push(`After:`, + [funcBeforeOrAfter(child.after, child.path)] );
    } else {
      console.log(`The 'After' property for '${fullPath}' is a primitive type. Pushing to 'ulItems'...`);
      ulItems.push(`After: ${child.after}`);
    };

    // Recursively process children if present
    if (child.children && Array.isArray(child.children)) {
      console.log(`The 'Children' property for '${fullPath}' has ${child.children.length} child(ren). Processing...`);
      ulItems.push(
        { h4: "Child Resource(s)"},
        { ul: funcDeltaChild(child.children, fullPath) }
      );
    };

    result.push( ulItems );
  });

  return result;
};

function funcBeforeOrAfter(beforeOrAfter: any, path: string = ''): any {
  if (beforeOrAfter && Array.isArray(beforeOrAfter)) {
    console.log(`Processing '${beforeOrAfter.length}' items in beforeOrAfter array in funcBeforeOrAfter for path '${path}'.` );
    const subItems: any[] = [];
    beforeOrAfter.forEach((element: any) => {
      const subList: any[] = [];
      //Dynamically get all key/value pairs in the object     
      if (Array.isArray(element) || ( typeof element === 'object' && element !== null )) {
        console.log(`Recursing 'element' of type '${typeof element}' within path '${path}'` );
        subList.push({ ul: funcBeforeOrAfter(element, path) });
      //} else if (Array.isArray(element)) {
      //  console.log(`Processing array else if 'Array' element[${key}] - path:`, path);
      //  subList.push({ ul: funcBeforeOrAfter(value, key) });
      } else {
        console.log(`Processing primitive 'element' of type '${typeof element}' with the value of '${element}' within path '${path}'`);
        subList.push(element);
      }
      subItems.push([subList]);
      console.log(`Finished processing 'element' of type '${typeof element}' in path '${path}'` );
    });
    console.log('Finished processing array beforeOrAfter:', path );
    return ([
      { ul: `${path}:` },
      { ul: [subItems] }
    ]);
  } else if (typeof beforeOrAfter === 'object' && beforeOrAfter !== null) {
    console.log(`Processing object beforeOrAfter in funcBeforeOrAfter for path '${path}'` );
    const subItems: any[] = [];
    const propertyNames = Object.keys(beforeOrAfter);
    propertyNames.forEach(key => {
      const subList: any[] = [];
      if (typeof beforeOrAfter[key] === 'object' && beforeOrAfter[key] !== null ) {
        console.log(`Processing object for beforeOrAfter[${key}] as '${typeof beforeOrAfter[key]}' - path:`, path )
        subList.push({ ul: funcBeforeOrAfter(beforeOrAfter[key], key) });
      } else if (Array.isArray(beforeOrAfter[key])) {
        console.log(`Processing array else if 'Array' beforeOrAfter[${key}] - path:`, path)
        subList.push({ ul: funcBeforeOrAfter(beforeOrAfter[key], key)});
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