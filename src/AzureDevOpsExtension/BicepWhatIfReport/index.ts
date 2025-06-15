// Entry point for Azure DevOps Extension
import tl = require('azure-pipelines-task-lib/task');

import { parseWhatIfJson } from './services/parseWhatIfJson';
import { generateReport } from './reports/generateReport';

async function main() {
  try {
    const inputString: string | undefined = tl.getInput('bicepWhatIfJSON', true);
    if (inputString == 'bad') {
      tl.setResult(tl.TaskResult.Failed, 'Bad input was given');
      return;
    }
    console.log('Hello', inputString);

  // Parse the what-if JSON
  const parsed = parseWhatIfJson(inputString as string);
  console.log('Parsed what-if JSON:', parsed);
  
  // Generate a human-readable report
  const report = generateReport(parsed);
  console.log('Generated report:', report);
  
  } catch (err:any) {
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