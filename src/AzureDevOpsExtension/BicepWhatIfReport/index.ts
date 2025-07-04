
//import * as fs from 'fs';
//import * as path from 'path';

// Entry point for Azure DevOps Extension
import tl = require('azure-pipelines-task-lib/task');
import { parseWhatIfJson } from './services/parseWhatIfJson';
import { generateReport } from './reports/generateReport';

async function main() {
  try {
    //const inputFilePath = path.resolve(__dirname, '../../../tests/AzureDevOpsExtension/report.json');
    //const outputFilePath = path.resolve(__dirname, 'test.md');
    //const inputString = fs.readFileSync(inputFilePath, 'utf8');
    const inputString: string | undefined = tl.getInput('bicepWhatIfJSON', true);
    if (inputString == 'bad') {
      tl.setResult(tl.TaskResult.Failed, 'Bad input was given');
      return;
    }

    // Parse the what-if JSON
    const parsed = parseWhatIfJson(inputString as string);
    //console.log('Parsed what-if JSON:', parsed);
  
    // Generate a human-readable report
    const report = generateReport(parsed);
    //console.log('Generated report:', report);
    
    //fs.writeFileSync(outputFilePath, await report, 'utf-8');
    return tl.setResult(tl.TaskResult.Succeeded, await report);
  } catch (err:any) {
    console.error('Error:', err.message);
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});