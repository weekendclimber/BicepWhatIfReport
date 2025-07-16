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
      const truncatedContent = fileContent.length > 100 ? fileContent.substring(0, 100) + '...' : fileContent;
      tl.debug(`File content read successfully (truncated): ${truncatedContent}\n\n`);

      tl.debug(`Removing BOM if present in the file content...`);
      if (fileContent.charCodeAt(0) === 0xfeff) {
        fileContent = fileContent.replace(/^\uFEFF/, '');
        tl.debug(`BOM detected and removed.`);
      }

      tl.debug(`Parsing what-if JSON content...\n\n`);
      parsed = JSON.parse(fileContent);
      tl.debug(`Parsed what-if JSON successfully.\n\n`);
      return parsed;
    }
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Failed to parse what-if JSON: ${err.message}`);
    } else {
      throw new Error(`Failed to parse what-if JSON: ${err}`);
    }
  }
}
