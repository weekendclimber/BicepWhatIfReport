
//import * as fs from 'fs';
//import * as path from 'path';

// Entry point for Azure DevOps Extension
import tl = require('azure-pipelines-task-lib/task');
import { parseWhatIfJson } from './services/parseWhatIfJson';
import { generateReport } from './reports/generateReport';

async function run() {
  try {
    //const inputFilePath = path.resolve(__dirname, '../../../tests/AzureDevOpsExtension/report.json');
    //const outputFilePath = path.resolve(__dirname, 'test.md');
    //const inputString = fs.readFileSync(inputFilePath, 'utf8');
    let parsed: object;
    let report: Promise<string>;

    const inputString: string | undefined = tl.getInput('bicepWhatIfJSON', true);
    if (inputString === undefined) {
      const errorMessage = 'No JSON input was given!';
      //tl.setResult(tl.TaskResult.Failed, errorMessage);
      throw new Error(`Error: ${errorMessage}`);
    }

    // Parse the what-if JSON
    parsed = parseWhatIfJson(inputString as string);
    // Generate a human-readable report
    report = generateReport(parsed);
    //fs.writeFileSync(outputFilePath, await report, 'utf-8');
    return tl.setResult(tl.TaskResult.Succeeded, await report); 
  } catch (err: any) {
    if (err instanceof Error) {
      console.error(`Error: ${err.message}`);
      tl.setResult(tl.TaskResult.Failed, err.message);
    } else {
      console.error(`Unknown Error: ${err}`);
      tl.setResult(tl.TaskResult.Failed, `err: ${err}`);
    }
    //process.exit(1);
  }
}

run()
  //.catch((err: any) => {
  //  if (err instanceof Error) {
  //    console.error(`Runtime Error: ${err.message}`);
  //    tl.setResult(tl.TaskResult.Failed, err.message);
  //  } else {
  //    console.error(`Unknown Error: ${err}`);
  //    tl.setResult(tl.TaskResult.Failed, `err: ${err}`);
  //  }
  //});