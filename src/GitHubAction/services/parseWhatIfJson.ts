/**
 * Parses Bicep what-if JSON output and returns a structured object.
 * @param whatIfJson - The raw JSON string from Bicep what-if output.
 * @returns Parsed representation of the what-if changes.
 */
export function parseWhatIfJson(whatIfJson: string): any {
  // Input validation
  if (whatIfJson === null || whatIfJson === undefined) {
    throw new Error('Failed to parse what-if JSON: Input cannot be null or undefined');
  }
  
  if (typeof whatIfJson !== 'string') {
    throw new Error('Failed to parse what-if JSON: Input must be a string');
  }
  
  if (whatIfJson.trim() === '') {
    throw new Error('Failed to parse what-if JSON: Input cannot be empty');
  }
  
  try {
    const parsed = JSON.parse(whatIfJson);
    // TODO: Transform parsed data into a domain-specific structure if needed
    return parsed;
  } catch (error) {
    throw new Error('Failed to parse what-if JSON: ' + error);
  }
}