"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Entry point for Azure DevOps Extension
const tl = require("azure-pipelines-task-lib/task");
const parseWhatIfJson_1 = require("./services/parseWhatIfJson");
const generateReport_1 = require("./reports/generateReport");
async function main() {
    try {
        const inputString = tl.getInput('bicepWhatIfJSON', true);
        if (inputString == 'bad') {
            tl.setResult(tl.TaskResult.Failed, 'Bad input was given');
            return;
        }
        //console.log('Hello', inputString);
        // Parse the what-if JSON
        const parsed = (0, parseWhatIfJson_1.parseWhatIfJson)(inputString);
        //console.log('Parsed what-if JSON:', parsed);
        // Generate a human-readable report
        const report = (0, generateReport_1.generateReport)(parsed);
        //const report = generateReport(inputString as string);
        console.log('Generated report:', report);
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
    //  // Placeholder: Load what-if JSON from input (e.g., file, pipeline variable)
    //  const whatIfJson = '{}'; // Replace with actual input source
    //
    //
    //  // Output the report (e.g., to pipeline summary, file, or console)
    //  console.log(report);
}
main();
//main().catch((err) => {
//  console.error('Error:', err);
//  process.exit(1);
//});
