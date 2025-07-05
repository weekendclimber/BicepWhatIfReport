"use strict";
/**
 * Parses Bicep what-if JSON output and returns a structured object.
 * @param whatIfJson - The raw JSON string from Bicep what-if output.
 * @returns Parsed representation of the what-if changes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWhatIfJson = parseWhatIfJson;
function parseWhatIfJson(whatIfJson) {
    // TODO: Implement robust parsing logic for Bicep what-if output
    try {
        //console.log('Parsing what-if JSON:', whatIfJson);
        const parsed = JSON.parse(whatIfJson);
        // TODO: Transform parsed data into a domain-specific structure if needed
        return parsed;
    }
    catch (err) {
        throw new Error(`Failed to parse what-if JSON: ${err.message}`);
    }
}
