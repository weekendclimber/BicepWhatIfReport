
import * as fs from 'fs';
import * as path from 'path';

// Entry point for Azure DevOps Extension
import tl = require('azure-pipelines-task-lib/task');
import { parseWhatIfJson } from './services/parseWhatIfJson';
import { generateReport } from './reports/generateReport';
//import { get } from 'http';

const ATTACHMENT_TYPE: string = 'bicepwhatifreport';

async function run() {
  try {
    //const inputFilePath = path.resolve(__dirname, '../../../tests/AzureDevOpsExtension/report.json');
    //const outputFilePath = path.resolve(__dirname, 'test.md');
    //const inputString = fs.readFileSync(inputFilePath, 'utf8');
    let reports: string[] = [];
    let baseDirectory: string = '';

    // Get the base directory from the task input
    const whatIfJSONPath: string | undefined = tl.getInput('bicepWhatIfJSONPath', true);
    if (!whatIfJSONPath) {
      tl.debug('Markdown path input is not provided.');
      tl.setResult(tl.TaskResult.Failed, 'Markdown path is required.');
      return;
    } else {
      tl.debug(`Markdown path input: ${whatIfJSONPath}`);
    }
    // Check if the provided path is absolute
    if (!path.isAbsolute(whatIfJSONPath)) {
      // Convert relative path to absolute path
      baseDirectory = path.join(tl.getVariable('System.DefaultWorkingDirectory') || '', whatIfJSONPath);
      tl.debug(`Converted relative path to absolute path: ${baseDirectory}`);
    } else {
      // Use the absolute path as is
      baseDirectory = whatIfJSONPath;
      tl.debug(`Base directory is already absolute: ${baseDirectory}`);
    }
    // Check if the base directory exists
    if (!fs.statSync(baseDirectory).isDirectory()) {
      tl.debug(`The provided path is not a directory: ${baseDirectory}`);
      tl.setResult(tl.TaskResult.Failed, `The provided path is not a directory: ${baseDirectory}`);
      return;
    } else {
      tl.debug(`Base directory exists: ${baseDirectory}`);
    }

    // Get all JSON files in the base directory, assuming that they are the bicep what-if reports
    const jsonFiles: string[] = await getFiles(baseDirectory);
    if (!jsonFiles || jsonFiles.length === 0) {
      tl.debug(`No JSON files found in the directory: ${baseDirectory}`);
      tl.setResult(tl.TaskResult.Succeeded, `No JSON files found in the directory: ${baseDirectory}`);
      return;
    } else {
      tl.debug(`Found JSON '${jsonFiles.length}' files:\n\t${jsonFiles.join(`\n\t`)}`);
    }

    await Promise.all(jsonFiles.map(async file => {
      const filePath: string = path.join(baseDirectory, file);
      const outputFilePath: string = path.join(baseDirectory, `${file.replace('.json', '.md')}`);
      let report: string;

      // Check if the file exists
      if (!fs.existsSync(filePath)) {
        tl.setResult(tl.TaskResult.Failed, `The file '${file}' does not exist at path: ${filePath}`);
        return;
      } else {
        tl.debug(`Parsing file '${file}' at path: ${filePath}`);
        let parsed: object = await parseWhatIfJson(filePath as string);
        tl.debug(`Generating report for file: ${file}`);
        report = await generateReport(parsed);
      }
      
      // Write report to output file
      if(!report) {
        tl.setResult(tl.TaskResult.Failed, `Failed to generate report for file '${file}' in path: ${filePath}`);
        return;
      } else {
        tl.debug(`Writing report to file: ${outputFilePath}`);
        reports.push(outputFilePath);
        await fs.promises.writeFile(outputFilePath, report, 'utf-8');
      }
    }));

    // Add attachments for all generated reports
    if (reports.length > 0) {
      tl.debug(`Adding attachments for '${reports.length}' generated reports:\n\t${reports.join(`\n\t`)}`);
      addAttachments(reports, baseDirectory);
    }

    // All reports have been parsed, generate, written, and attached.
    tl.debug(`Generated reports for '${reports.length}' files:\n\t${reports.join(`\n\t`)}`);
    tl.setResult(tl.TaskResult.Succeeded, `Generated reports for '${reports.length}' files:\n\t${reports.join(`\n\t`)}`);
    return;
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

// Function to get all JSON files in a directory
async function getFiles(dir: string): Promise<string[]> {
  const dirents = (await fs.promises.readdir(dir, { withFileTypes: true })).filter(file => file.name.endsWith('.json'));
  const files: string[] = await Promise.all(dirents.map((dirent) => {
      const res: string = path.resolve(dir, dirent.name);
      return res;
  }));
  return Array.prototype.concat(...files);
}

function addAttachments(files: string[], baseDir: string) {
  const absoluteFiles = files.map(file => path.resolve(baseDir, file));
  const relativeFiles = files.map(file => path.relative(baseDir, file));
  absoluteFiles.forEach((absoluteFile, index) => {
      const relativeFile = relativeFiles[index];
      const name = escapeFilename(relativeFile);
      tl.addAttachment(ATTACHMENT_TYPE, name, absoluteFile);
  });
}

function escapeFilename(filename: string): string {
  const ESCAPED_CHARACTERS = '<>|:*?\\/ ';
  const LOG_ESCAPE_CHARACTER = "^";
  filename = "md/" + replaceAll(filename, "\\", "/");
  const chars = LOG_ESCAPE_CHARACTER + ESCAPED_CHARACTERS;
  for (let i = 0; i < chars.length; i++) {
      const num = `${i}`.padStart(2, "0");
      filename = replaceAll(filename, chars[i], `${LOG_ESCAPE_CHARACTER}${num}`);
  }
  return filename;
}

function replaceAll(text: string, pattern: string, replacement: string) {
  return text.split(pattern).join(replacement);
}