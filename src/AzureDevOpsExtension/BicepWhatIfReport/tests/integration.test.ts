import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import tl = require('azure-pipelines-task-lib/task');

// Import the main function from index.ts for testing
import { parseWhatIfJson } from '../services/parseWhatIfJson';
import { generateReport } from '../reports/generateReport';

describe('Integration Tests', () => {
  const testDataDir = path.join(__dirname, 'test-data');
  const tempOutputDir = path.join(__dirname, '..', 'temp-output');

  beforeEach(() => {
    // Clean up temp directory before each test
    if (fs.existsSync(tempOutputDir)) {
      fs.rmSync(tempOutputDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempOutputDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up temp directory after each test
    if (fs.existsSync(tempOutputDir)) {
      fs.rmSync(tempOutputDir, { recursive: true, force: true });
    }
  });

  describe('Report Generation Integration', () => {
    it('should generate markdown report from JSON and write to output directory', async () => {
      const inputFile = path.join(testDataDir, 'minimal-valid.json');
      const outputFile = path.join(tempOutputDir, 'minimal-valid.md');

      // Parse the JSON
      const parsed = await parseWhatIfJson(inputFile);
      expect(parsed).to.be.an('object');

      // Generate the report
      const report = await generateReport(parsed);
      expect(report).to.be.a('string');
      expect(report).to.include('Bicep What-If Report');

      // Write to output directory
      await fs.promises.writeFile(outputFile, report, 'utf-8');

      // Verify file was created and has content
      expect(fs.existsSync(outputFile)).to.be.true;
      const fileContent = await fs.promises.readFile(outputFile, 'utf-8');
      expect(fileContent).to.equal(report);
      expect(fileContent.length).to.be.greaterThan(0);
    });

    it('should handle multiple JSON files and generate corresponding markdown files', async () => {
      const inputFiles = ['minimal-valid.json', 'all-change-types.json', 'empty-deployment.json'];

      const reports = [];

      for (const inputFileName of inputFiles) {
        const inputFile = path.join(testDataDir, inputFileName);
        const outputFile = path.join(tempOutputDir, inputFileName.replace('.json', '.md'));

        // Parse and generate report
        const parsed = await parseWhatIfJson(inputFile);
        const report = await generateReport(parsed);

        // Write to output directory
        await fs.promises.writeFile(outputFile, report, 'utf-8');
        reports.push(outputFile);
      }

      // Verify all files were created
      expect(reports).to.have.length(3);
      for (const reportFile of reports) {
        expect(fs.existsSync(reportFile)).to.be.true;
        const content = await fs.promises.readFile(reportFile, 'utf-8');
        expect(content).to.include('Bicep What-If Report');
      }
    });

    it('should generate valid markdown content that can be rendered', async () => {
      const inputFile = path.join(testDataDir, 'all-change-types.json');

      // Parse and generate report
      const parsed = await parseWhatIfJson(inputFile);
      const report = await generateReport(parsed);

      // Check for markdown elements
      expect(report).to.include('# Bicep What-If Report');
      expect(report).to.include('## Resource Name:');
      expect(report).to.include('### Change Type:');

      // Should contain proper markdown lists
      expect(report).to.match(/^ - \*\*Name\*\*:/m);
      expect(report).to.match(/^ - Type:/m);

      // Should contain blockquotes for resource IDs
      expect(report).to.include('> **Resource ID**:');
    });
  });
});
