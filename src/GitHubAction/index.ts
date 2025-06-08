// Entry point for GitHub Action

import * as core from '@actions/core';
import { parseWhatIfJson } from './services/parseWhatIfJson';
import { generateReport } from './reports/generateReport';

async function run() {
  try {
    // Get input from GitHub Action workflow
    const whatIfJson = core.getInput('whatif-json', { required: true });

    // Parse the what-if JSON
    const parsed = parseWhatIfJson(whatIfJson);

    // Generate a human-readable report
    const report = generateReport(parsed);

    // Set the report as an output or write to a file
    core.setOutput('report', report);
  } catch (error) {
    core.setFailed(`Action failed with error: ${error}`);
  }
}

run();