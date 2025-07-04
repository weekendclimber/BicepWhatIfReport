"use strict";
//import * as fs from 'fs';
//import * as path from 'path';
Object.defineProperty(exports, "__esModule", { value: true });
// Entry point for Azure DevOps Extension
const tl = require("azure-pipelines-task-lib/task");
const parseWhatIfJson_1 = require("./services/parseWhatIfJson");
const generateReport_1 = require("./reports/generateReport");
async function main() {
    try {
        //const inputFilePath = path.resolve(__dirname, '../../../tests/AzureDevOpsExtension/report.json');
        //const outputFilePath = path.resolve(__dirname, 'test.md');
        //const inputString = fs.readFileSync(inputFilePath, 'utf8');
        const inputString = tl.getInput('bicepWhatIfJSON', true);
        if (inputString == 'bad') {
            tl.setResult(tl.TaskResult.Failed, 'Bad input was given');
            return;
        }
        // Parse the what-if JSON
        const parsed = (0, parseWhatIfJson_1.parseWhatIfJson)(inputString);
        //console.log('Parsed what-if JSON:', parsed);
        // Generate a human-readable report
        const report = (0, generateReport_1.generateReport)(parsed);
        //console.log('Generated report:', report);
        //fs.writeFileSync(outputFilePath, await report, 'utf-8');
        return tl.setResult(tl.TaskResult.Succeeded, await report);
    }
    catch (err) {
        console.error('Error:', err.message);
        tl.setResult(tl.TaskResult.Failed, err.message);
        process.exit(1);
    }
}
main().catch((err) => {
    console.error('Error:', err);
    tl.setResult(tl.TaskResult.Failed, err.message);
    process.exit(1);
});
