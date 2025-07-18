/**
 * Parses Bicep what-if JSON output and returns a structured object.
 * @param file - The absolute file path to the raw JSON file from the Bicep what-if command.
 * @returns Parsed representation of the what-if changes as object.
 */

import * as fs from 'fs'; // File and path imports
import tl = require('azure-pipelines-task-lib/task'); // Entry point for Azure DevOps Extension

const TRUNCATION_LENGTH: number = 100;
const UTF8_BOM: string = '\uFEFF'; // UTF-8 BOM
const UTF16_BE_BOM: string = '\uFFFE'; // UTF-16 BE BOM
const UTF16_LE_BOM: string = '\uFEFF'; // UTF-16 LE BOM (same as Unicode BOM)
const UTF32_BE_BOM: string = '\u0000\uFEFF'; // UTF-32 BE BOM
const UTF32_LE_BOM: string = '\uFFFE\u0000'; // UTF-32 LE BOM

/**
 * Cleans file content by removing various types of BOMs, control characters, and leading/trailing whitespace
 * @param content - The raw file content to clean
 * @returns Cleaned content ready for JSON parsing
 */
function cleanFileContent(content: string): string {
  let cleanedContent = content;

  // Remove various types of BOMs
  const boms = [UTF8_BOM, UTF16_BE_BOM, UTF16_LE_BOM, UTF32_BE_BOM, UTF32_LE_BOM];
  for (const bom of boms) {
    if (cleanedContent.startsWith(bom)) {
      cleanedContent = cleanedContent.slice(bom.length);
      tl.debug(`BOM detected and removed: ${bom.charCodeAt(0).toString(16)}`);
      break;
    }
  }

  // Remove null bytes and other control characters that might interfere with JSON parsing
  // eslint-disable-next-line no-control-regex
  cleanedContent = cleanedContent.replace(/\u0000/g, ''); // Remove null bytes
  // eslint-disable-next-line no-control-regex
  cleanedContent = cleanedContent.replace(/[\u0001-\u0008\u000B-\u000C\u000E-\u001F]/g, ''); // Remove other control chars, keep \n, \r, \t

  // Remove zero-width characters that might interfere with JSON parsing
  cleanedContent = cleanedContent.replace(/[\u200B-\u200D\u2060\uFEFF]/g, ''); // Remove zero-width chars and additional BOM variants

  // Remove other invisible Unicode characters that might cause parsing issues
  cleanedContent = cleanedContent.replace(
    /[\u00A0\u1680\u180E\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/g,
    ' '
  ); // Replace non-breaking spaces with regular spaces

  // Trim leading and trailing whitespace
  cleanedContent = cleanedContent.trim();

  return cleanedContent;
}

export async function parseWhatIfJson(file: string): Promise<object> {
  // TODO: Implement robust parsing logic for Bicep what-if output
  let parsed: object;

  try {
    tl.debug(`Trying to parse what-if JSON file: ${file}`);

    // Check if the file exists before attempting to read it
    if (!fs.existsSync(file)) {
      tl.debug(`The file does not exist: ${file}`);
      //tl.setResult(tl.TaskResult.Failed, `The file does not exist: ${file}`);
      throw new Error(`The file does not exist: ${file}`);
    }

    // Attempt to read the file content with robust encoding handling
    let fileContent: string;
    try {
      tl.debug(`Attempting to read what-if JSON file: ${file}`);

      // First try reading as UTF-8
      try {
        fileContent = await fs.promises.readFile(file, 'utf8');
        tl.debug(`File content read successfully with utf8 encoding.`);
      } catch (utf8Error: any) {
        tl.debug(`Failed to read file with utf8 encoding: ${utf8Error.message}`);

        // If UTF-8 fails, try reading as binary and then convert
        try {
          tl.debug(`Attempting to read file as binary buffer...`);
          const buffer = await fs.promises.readFile(file);

          // Convert buffer to string, handling potential encoding issues
          fileContent = buffer.toString('utf8');
          tl.debug(`File content read successfully as binary buffer and converted to utf8.`);
        } catch (bufferError: any) {
          tl.debug(`Failed to read file as binary buffer: ${bufferError.message}`);
          throw new Error(
            `Failed to read file with both utf8 and binary methods: ${bufferError.message}`
          );
        }
      }
    } catch (readError: any) {
      tl.debug(`Failed to read the file: ${file}\nError: ${readError.message}`);
      //tl.setResult(tl.TaskResult.Failed, `Failed to read the file: ${file}`);
      throw new Error(`Failed to read the file: ${file}\nError: ${readError.message}`);
    }

    // Debug truncated content for logging
    const truncatedContent =
      fileContent.length > TRUNCATION_LENGTH
        ? fileContent.substring(0, TRUNCATION_LENGTH) + '...'
        : fileContent;
    tl.debug(`File content read successfully (truncated): ${truncatedContent}`);

    // Clean file content (remove BOMs, control characters, and whitespace)
    tl.debug(`Cleaning file content (removing BOMs, control characters, and whitespace)...`);
    const originalLength = fileContent.length;
    fileContent = cleanFileContent(fileContent);
    if (fileContent.length !== originalLength) {
      tl.debug(`File content cleaned: ${originalLength} -> ${fileContent.length} characters`);
    }

    // Debug cleaned content for logging
    const cleanedTruncatedContent =
      fileContent.length > TRUNCATION_LENGTH
        ? fileContent.substring(0, TRUNCATION_LENGTH) + '...'
        : fileContent;
    tl.debug(`Cleaned file content (truncated): ${cleanedTruncatedContent}`);

    // Parse the JSON content
    try {
      tl.debug(`Parsing what-if JSON content...`);
      parsed = JSON.parse(fileContent);
      tl.debug(`Parsed what-if JSON successfully.`);
    } catch (parseError: any) {
      tl.debug(`Failed to parse the JSON content: ${parseError.message}`);
      //tl.setResult(tl.TaskResult.Failed, `Failed to parse the JSON content: ${parseError.message}`);
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
