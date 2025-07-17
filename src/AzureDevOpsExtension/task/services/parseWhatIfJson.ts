/**
 * Parses Bicep what-if JSON output and returns a structured object.
 * @param file - The absolute file path to the raw JSON file from the Bicep what-if command.
 * @returns Parsed representation of the what-if changes as object.
 */

import * as fs from 'fs'; // File and path imports
import tl = require('azure-pipelines-task-lib/task'); // Entry point for Azure DevOps Extension

const TRUNCATION_LENGTH: number = 100; // Length to truncate file content for debugging
const UNICODE_BOM: number = 0xfeff; // Unicode Byte Order Mark

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
      const truncatedContent =
        fileContent.length > TRUNCATION_LENGTH
          ? fileContent.substring(0, TRUNCATION_LENGTH) + '...'
          : fileContent;
      tl.debug(`File content read successfully (truncated): ${truncatedContent}\n\n`);

      tl.debug(`Removing BOM if present in the file content...`);
      if (fileContent.charCodeAt(0) === UNICODE_BOM) {
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
