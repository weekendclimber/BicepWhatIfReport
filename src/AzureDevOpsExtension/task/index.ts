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
    const reports: string[] = [];
    let inputDirectory: string = '';
    let outputDirectory: string = '';

    // Get the base directory from the task input
    const whatIfJSONPath: string | undefined = tl.getInput('bicepWhatIfJSONPath', true);
    if (!whatIfJSONPath) {
      tl.debug('What-If JSON path input is not provided.');
      tl.setResult(tl.TaskResult.Failed, 'What-If JSON path is required.');
      return;
    } else {
      tl.debug(`What-If JSON path input: ${whatIfJSONPath}`);
    }

    // Check if the provided path is absolute
    if (!path.isAbsolute(whatIfJSONPath)) {
      // Convert relative path to absolute path
      inputDirectory = path.join(
        tl.getVariable('System.DefaultWorkingDirectory') || '',
        whatIfJSONPath
      );
      tl.debug(`Converted relative path to absolute path: ${inputDirectory}`);
    } else {
      // Use the absolute path as is
      inputDirectory = whatIfJSONPath;
      tl.debug(`Input directory is already absolute: ${inputDirectory}`);
    }

    // Set output directory to Build.ArtifactStagingDirectory
    const artifactStagingDirectory = tl.getVariable('Build.ArtifactStagingDirectory');
    if (!artifactStagingDirectory) {
      tl.debug('Build.ArtifactStagingDirectory is not set, falling back to input directory');
      outputDirectory = inputDirectory;
    } else {
      outputDirectory = artifactStagingDirectory;
      tl.debug(`Output directory set to Build.ArtifactStagingDirectory: ${outputDirectory}`);
    }

    // Check if the input directory exists and exit gracefully if it does not
    if (!fs.existsSync(inputDirectory) || !fs.statSync(inputDirectory).isDirectory()) {
      tl.warning(`The provided path does not exist or is not a directory: ${inputDirectory}`);
      tl.setResult(
        tl.TaskResult.SucceededWithIssues,
        `The provided path does not exist or is not a directory: ${inputDirectory}`
      );
      return;
    } else {
      tl.debug(`Input directory exists: ${inputDirectory}`);
    }

    // Ensure output directory exists
    if (!fs.existsSync(outputDirectory)) {
      await fs.promises.mkdir(outputDirectory, { recursive: true });
      tl.debug(`Created output directory: ${outputDirectory}`);
    }

    // Get all JSON files in the input directory, assuming that they are the bicep what-if reports
    const jsonFiles: string[] = await getFiles(inputDirectory);
    if (!jsonFiles || jsonFiles.length === 0) {
      tl.debug(`No JSON files found in the directory: ${inputDirectory}`);
      tl.setResult(
        tl.TaskResult.Succeeded,
        `No JSON files found in the directory: ${inputDirectory}`
      );
      return;
    } else {
      tl.debug(`Found JSON '${jsonFiles.length}' files:\n\t${jsonFiles.join(`\n\t`)}`);
    }

    await Promise.all(
      jsonFiles.map(async file => {
        const filePath: string = file; // Use file directly since it is already an absolute path
        const outputFilePath: string = path.join(
          outputDirectory,
          path.basename(file).replace('.json', '.md')
        ); // Output to staging directory
        let report: string;

        // Check if the file exists
        if (!fs.existsSync(filePath)) {
          tl.setResult(
            tl.TaskResult.Failed,
            `The file '${file}' does not exist at path: ${filePath}`
          );
          return;
        } else {
          tl.debug(`Parsing file '${file}' at path: ${filePath}`);
          const parsed: object = await parseWhatIfJson(filePath as string);
          tl.debug(`Generating report for file: ${file}`);
          report = await generateReport(parsed);
        }

        // Write report to output file
        if (!report) {
          tl.setResult(
            tl.TaskResult.Failed,
            `Failed to generate report for file '${file}' in path: ${filePath}`
          );
          return;
        } else {
          tl.debug(`Writing report to file: ${outputFilePath}`);
          reports.push(outputFilePath);
          await fs.promises.writeFile(outputFilePath, report, 'utf-8');
        }
      })
    );

    // Add attachments for all generated reports
    if (reports.length > 0) {
      tl.debug(
        `Adding attachments for '${reports.length}' generated reports:\n\t${reports.join(`\n\t`)}`
      );
      addAttachments(reports, outputDirectory);

      // Publish markdown files as build artifacts
      tl.debug(`Publishing '${reports.length}' markdown files as build artifacts`);
      tl.uploadArtifact('BicepWhatIfReports', outputDirectory, 'BicepWhatIfReports');
    }

    // All reports have been parsed, generate, written, and attached.
    tl.debug(`Generated reports for '${reports.length}' files:\n\t${reports.join(`\n\t`)}`);
    tl.setResult(
      tl.TaskResult.Succeeded,
      `Generated reports for '${reports.length}' files:\n\t${reports.join(`\n\t`)}`
    );
    return;
  } catch (err) {
    if (err instanceof Error) {
      tl.error(`Error: ${err.message}`);
      tl.setResult(tl.TaskResult.Failed, err.message);
    } else {
      tl.error(`Unknown Error: ${err}`);
      tl.setResult(tl.TaskResult.Failed, `err: ${err}`);
    }
  }
}

run().catch(err => {
  if (err instanceof Error) {
    tl.error(`Runtime Error: ${err.message}`);
    tl.setResult(tl.TaskResult.Failed, err.message);
  } else {
    tl.error(`Unknown Error: ${err}`);
    tl.setResult(tl.TaskResult.Failed, `err: ${err}`);
  }
});

// Function to get all JSON files in a directory
export async function getFiles(dir: string): Promise<string[]> {
  const dirents = (await fs.promises.readdir(dir, { withFileTypes: true })).filter(file =>
    file.name.endsWith('.json')
  );
  tl.debug(`Found ${dirents.length} JSON files in directory: ${dir}`);
  const files: string[] = await Promise.all(
    dirents.map(dirent => {
      const res: string = path.resolve(dir, dirent.name);
      return res;
    })
  );
  return Array.prototype.concat(...files);
}

function addAttachments(files: string[], baseDir: string) {
  files.forEach(absoluteFile => {
    const relativeFile = path.relative(baseDir, absoluteFile);
    const name = escapeFilename(relativeFile);
    tl.debug(`Adding attachment: ${name} from file: ${absoluteFile}`);
    tl.addAttachment(ATTACHMENT_TYPE, name, absoluteFile);
  });
}

function escapeFilename(filename: string): string {
  const ESCAPED_CHARACTERS = '<>|:*?\\/ ';
  const LOG_ESCAPE_CHARACTER = '^';
  filename = 'md/' + replaceAll(filename, '\\', '/');
  const chars = LOG_ESCAPE_CHARACTER + ESCAPED_CHARACTERS;
  for (let i = 0; i < chars.length; i++) {
    const num = `${i}`.padStart(2, '0');
    filename = replaceAll(filename, chars[i], `${LOG_ESCAPE_CHARACTER}${num}`);
  }
  return filename;
}

function replaceAll(text: string, pattern: string, replacement: string) {
  return text.split(pattern).join(replacement);
}
