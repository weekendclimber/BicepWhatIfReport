
import * as fs from 'fs';
import * as path from 'path';

// Entry point for Azure DevOps Extension
import tl = require('azure-pipelines-task-lib/task');
import { parseWhatIfJson } from './services/parseWhatIfJson';
import { generateReport } from './reports/generateReport';
//import { get } from 'http';

async function run() {
  try {
    //const inputFilePath = path.resolve(__dirname, '../../../tests/AzureDevOpsExtension/report.json');
    //const outputFilePath = path.resolve(__dirname, 'test.md');
    //const inputString = fs.readFileSync(inputFilePath, 'utf8');
    let parsed: object;
    let report: Promise<string>;
    let baseDirectory: string;

    // Get the base directory from the task input
    const markdownPath: string | undefined = tl.getInput('markdownPath', true);
    if (!markdownPath) {
      tl.setResult(tl.TaskResult.Failed, 'Markdown path is required.');
      return;
    } else {
      //baseDirectory = markdownPath;
      tl.debug(`Markdown path input: ${markdownPath}`);
    }

    // Check if the provided path is absolute
    if (!path.isAbsolute(markdownPath)) {
      // Convert relative path to absolute path
      baseDirectory = path.join(tl.getVariable('System.DefaultWorkingDirectory') || '', markdownPath);
      tl.debug(`Converted relative path to absolute path: ${baseDirectory}`);
    } else {
      // Use the absolute path as is
      baseDirectory = markdownPath;
      tl.debug(`Base directory is already absolute: ${baseDirectory}`);
    }
    // Check if the base directory exists
    if (!fs.statSync(baseDirectory).isDirectory()) {
      tl.setResult(tl.TaskResult.Failed, `The provided path is not a directory: ${baseDirectory}`);
      return;
    } else {
      tl.debug(`Base directory exists: ${baseDirectory}`);
    }

    

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

  function getPredefinedVariable(name: string) {
    name = replaceAll(name, ".", "_");
    name = replaceAll(name, " ", "_");
    return process.env[name];
}

function replaceAll(text: string, pattern: string, replacement: string) {
    return text.split(pattern).join(replacement);
}