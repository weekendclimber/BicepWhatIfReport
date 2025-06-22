// Entry point for Azure DevOps Extension
//import tl = require('azure-pipelines-task-lib/task');
import * as fs from 'fs';
import * as path from 'path';

//import md = require('azure-devops-ui/Markdown');
import { parseWhatIfJson } from './services/parseWhatIfJson';
import { generateReport } from './reports/generateReport';

async function main() {
  try {
    const inputFilePath = path.resolve(__dirname, '../../../tests/AzureDevOpsExtension/report.json');
    const outputFilePath = path.resolve(__dirname, 'test.md');
    const inputString = fs.readFileSync(inputFilePath, 'utf8');
    //const inputString: string | undefined = tl.getInput('bicepWhatIfJSON', true);
    //if (inputString == 'bad') {
    //  tl.setResult(tl.TaskResult.Failed, 'Bad input was given');
    //  return;
    //}
    //console.log('Hello', inputString);

  // Parse the what-if JSON
  const parsed = parseWhatIfJson(inputString as string);
  //console.log('Parsed what-if JSON:', parsed);
  
  // Generate a human-readable report
  const report = generateReport(parsed);
  //const report = generateReport(inputString as string);
  //console.log('Generated report:', report);
  fs.writeFileSync(outputFilePath, await report, 'utf-8');
  
  } catch (err:any) {
    console.error('Error:', err.message);
    process.exit(1);
    //tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});