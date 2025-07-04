"use strict";
//import * as fs from 'fs';
//import * as path from 'path';
Object.defineProperty(exports, "__esModule", { value: true });
// Entry point for Azure DevOps Extension
const tl = require("azure-pipelines-task-lib/task");
const parseWhatIfJson_1 = require("./services/parseWhatIfJson");
const generateReport_1 = require("./reports/generateReport");
async function run() {
    try {
        //const inputFilePath = path.resolve(__dirname, '../../../tests/AzureDevOpsExtension/report.json');
        //const outputFilePath = path.resolve(__dirname, 'test.md');
        //const inputString = fs.readFileSync(inputFilePath, 'utf8');
        let parsed;
        let report;
        const inputString = tl.getInput('bicepWhatIfJSON', true);
        if (inputString === undefined) {
            const errorMessage = 'No JSON input was given!';
            //tl.setResult(tl.TaskResult.Failed, errorMessage);
            throw new Error(`Error: ${errorMessage}`);
        }
        // Parse the what-if JSON
        parsed = (0, parseWhatIfJson_1.parseWhatIfJson)(inputString);
        // Generate a human-readable report
        report = (0, generateReport_1.generateReport)(parsed);
        //fs.writeFileSync(outputFilePath, await report, 'utf-8');
        return tl.setResult(tl.TaskResult.Succeeded, await report);
    }
    catch (err) {
        if (err instanceof Error) {
            console.error(`Error: ${err.message}`);
            tl.setResult(tl.TaskResult.Failed, err.message);
        }
        else {
            console.error(`Unknown Error: ${err}`);
            tl.setResult(tl.TaskResult.Failed, `err: ${err}`);
        }
        //process.exit(1);
    }
}
run();
//.catch((err: any) => {
//  if (err instanceof Error) {
//    console.error(`Runtime Error: ${err.message}`);
//    tl.setResult(tl.TaskResult.Failed, err.message);
//  } else {
//    console.error(`Unknown Error: ${err}`);
//    tl.setResult(tl.TaskResult.Failed, `err: ${err}`);
//  }
//});
