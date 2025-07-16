/**
 * Parses Bicep what-if JSON output and returns a structured object.
 * @param file - The absolute file path to the raw JSON file from the Bicep what-if command.
 * @returns Parsed representation of the what-if changes as object.
 */
// File and path imports
import * as fs from 'fs';

// Entry point for Azure DevOps Extension
import tl = require('azure-pipelines-task-lib/task');

export async function parseWhatIfJson(file: string): Promise<object> {
  // TODO: Implement robust parsing logic for Bicep what-if output
  let parsed: object;

  try {
    tl.debug(`Trying to parse what-if JSON file: ${file}`);
    if (!fs.existsSync(file)) {
      tl.debug(`The file does not exist: ${file}`);
      tl.setResult(tl.TaskResult.Failed, `The file does not exist: ${file}`);
      throw new Error(`The file does not exist: ${file}`);
    } else {
      tl.debug(`Reading what-if JSON file: ${file}\n\n`);
      let fileContent: string = await fs.promises.readFile(file, 'utf8');
      tl.debug(`File content read successfully: ${fileContent}\n\n`);
      parsed = JSON.parse(fileContent);
      tl.debug(`Parsed what-if JSON successfully: ${JSON.stringify(parsed)}\n\n`);
      return parsed;
    }
  } catch (err: any) {
    if (err instanceof Error) {
      throw new Error(`Failed to parse what-if JSON: ${err.message}`);
    } else {
      throw new Error(`Failed to parse what-if JSON: ${err}`);
    }
  }
}
