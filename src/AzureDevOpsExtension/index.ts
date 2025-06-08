// Entry point for Azure DevOps Extension

import { parseWhatIfJson } from './services/parseWhatIfJson';
import { generateReport } from './reports/generateReport';

async function main() {
  // Placeholder: Load what-if JSON from input (e.g., file, pipeline variable)
  const whatIfJson = '{}'; // Replace with actual input source

  // Parse the what-if JSON
  const parsed = parseWhatIfJson(whatIfJson);

  // Generate a human-readable report
  const report = generateReport(parsed);

  // Output the report (e.g., to pipeline summary, file, or console)
  console.log(report);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});