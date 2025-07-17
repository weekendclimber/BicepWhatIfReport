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

    // Check if the file exists before attempting to read it
    if (!fs.existsSync(file)) {
      tl.debug(`The file does not exist: ${file}`);
      tl.setResult(tl.TaskResult.Failed, `The file does not exist: ${file}`);
      throw new Error(`The file does not exist: ${file}`);
    }

    // Attempt to read the file content
    let fileContent: string;
    try {
      tl.debug(`Reading what-if JSON file: ${file}`);
      fileContent = await fs.promises.readFile(file, 'utf8');
    } catch (readError) {
      tl.debug(`Failed to read the file: ${file}`);
      tl.setResult(tl.TaskResult.Failed, `Failed to read the file: ${file}`);
      throw new Error(`Failed to read the file: ${file}`);
    }

    // Debug truncated content for logging
    const truncatedContent =
      fileContent.length > TRUNCATION_LENGTH
        ? fileContent.substring(0, TRUNCATION_LENGTH) + '...'
        : fileContent;
    tl.debug(`File content read successfully (truncated): ${truncatedContent}`);

    // Remove BOM if present
    tl.debug(`Removing BOM if present in the file content...`);
    if (fileContent.charCodeAt(0) === UNICODE_BOM) {
      fileContent = fileContent.replace(/^\uFEFF/, '');
      tl.debug(`BOM detected and removed.`);
    }

    // Parse the JSON content
    try {
      tl.debug(`Parsing what-if JSON content...`);
      parsed = JSON.parse(fileContent);
      tl.debug(`Parsed what-if JSON successfully.`);
    } catch (parseError: any) {
      tl.debug(`Failed to parse the JSON content: ${parseError.message}`);
      tl.setResult(tl.TaskResult.Failed, `Failed to parse the JSON content: ${parseError.message}`);
      throw new Error(`Failed to parse the JSON content: ${parseError.message}`);
    }

    // Return the parsed object
    return parsed;
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Failed to parse what-if JSON: ${err.message}`);
    } else {
      throw new Error(`Failed to parse what-if JSON: ${err}`);
    }
  }
}
