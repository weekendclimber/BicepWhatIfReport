import { expect } from 'chai';
import { readFileSync } from 'fs';
import { join } from 'path';
import { generateReport, jsonToMarkdown } from '../reports/generateReport';

// Helper function to load test data from JSON files
function loadTestData(filename: string): any {
  const filePath = join(__dirname, 'test-data', filename);
  const content = readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

describe('generateReport', () => {
  describe('generateReport function', () => {
    it('should generate a basic report for valid input', async () => {
      const testData = loadTestData('minimal-valid.json');

      const result = await generateReport(testData);

      expect(result).to.be.a('string');
      expect(result).to.include('# Bicep What-If Report');
      expect(result).to.include('Resource Name: teststorage001');
      expect(result).to.include('Change Type: Create');
      expect(result).to.include('Microsoft.Storage/storageAccounts');
    });

    it('should handle empty changes array', async () => {
      const testData = loadTestData('empty-deployment.json');

      const result = await generateReport(testData);

      expect(result).to.be.a('string');
      expect(result).to.include('# Bicep What-If Report');
    });

    it('should handle diagnostics if present', async () => {
      const testData = loadTestData('with-diagnostics.json');

      const result = await generateReport(testData);

      expect(result).to.be.a('string');
      expect(result).to.include('# Bicep What-If Report');
      expect(result).to.include('Diagnostic Code: BCP001');
      expect(result).to.include('Severity: Warning');
      expect(result).to.include('Test diagnostic message');
      expect(result).to.include('Additional test info');
    });
  });

  describe('jsonToMarkdown function', () => {
    it('should convert basic JSON data to markdown', async () => {
      const testData = loadTestData('minimal-valid.json');

      const result = await jsonToMarkdown(testData);

      expect(result).to.be.a('string');
      expect(result).to.include('# Bicep What-If Report');
      expect(result).to.include('## Resource Name: teststorage001');
      expect(result).to.include('### Change Type: Create');
    });

    it('should handle Modify change type with delta', async () => {
      const testData = loadTestData('all-change-types.json');
      // Extract just the modify change for this test
      const modifyTestData = {
        changes: testData.changes.filter((change: any) => change.changeType === 'Modify'),
      };

      const result = await jsonToMarkdown(modifyTestData);

      expect(result).to.be.a('string');
      expect(result).to.include('### Change Details');
      expect(result).to.include('Standard_B1s');
      expect(result).to.include('Standard_B2s');
    });

    it('should handle Delete change type', async () => {
      const testData = loadTestData('all-change-types.json');
      // Extract just the delete change for this test
      const deleteTestData = {
        changes: testData.changes.filter((change: any) => change.changeType === 'Delete'),
      };

      const result = await jsonToMarkdown(deleteTestData);

      expect(result).to.be.a('string');
      expect(result).to.include('## Resource Name: Unnamed Resource');
      expect(result).to.include('### Change Type: Delete');
    });

    it('should handle NoChange change type', async () => {
      const testData = loadTestData('all-change-types.json');
      // Extract just the NoChange change for this test
      const noChangeTestData = {
        changes: testData.changes.filter((change: any) => change.changeType === 'NoChange'),
      };

      const result = await jsonToMarkdown(noChangeTestData);

      expect(result).to.be.a('string');
      expect(result).to.include('## Resource Name: testvnet');
      expect(result).to.include('### Change Type: NoChange');
    });

    it('should handle Ignore change type', async () => {
      const testData = loadTestData('all-change-types.json');
      // Extract just the Ignore change for this test
      const ignoreTestData = {
        changes: testData.changes.filter((change: any) => change.changeType === 'Ignore'),
      };

      const result = await jsonToMarkdown(ignoreTestData);

      expect(result).to.be.a('string');
      expect(result).to.include('## Resource Name: Unnamed Resource');
      expect(result).to.include('### Change Type: Ignore');
    });

    it('should handle Unsupported change type', async () => {
      const testData = loadTestData('all-change-types.json');
      // Extract just the Unsupported change for this test
      const unsupportedTestData = {
        changes: testData.changes.filter((change: any) => change.changeType === 'Unsupported'),
      };

      const result = await jsonToMarkdown(unsupportedTestData);

      expect(result).to.be.a('string');
      expect(result).to.include('## Resource Name: Unnamed Resource');
      expect(result).to.include('### Change Type: Unsupported');
      expect(result).to.include('This API version does not support what-if analysis');
    });

    it('should handle unknown change types gracefully', async () => {
      const testData = loadTestData('unknown-change-type.json');

      const result = await jsonToMarkdown(testData);

      expect(result).to.be.a('string');
      expect(result).to.include('### Unknown Change Type');
      expect(result).to.include('UnknownType');
    });

    it('should handle complex nested delta changes', async () => {
      const testData = loadTestData('complex-array-delta.json');

      const result = await jsonToMarkdown(testData);

      expect(result).to.be.a('string');
      expect(result).to.include('### Change Details');
      expect(result).to.include('Child Resource(s)');
      expect(result).to.include('diskSizeGB');
      expect(result).to.include('128');
    });

    it('should handle missing properties gracefully', async () => {
      const testData = loadTestData('missing-properties.json');

      const result = await jsonToMarkdown(testData);

      expect(result).to.be.a('string');
      expect(result).to.include('## Resource Name: Unnamed Resource');
      expect(result).to.include('Unknown Resource ID');
      expect(result).to.include('Unknown Location');
    });

    it('should remove blank lines from output', async () => {
      const testData = loadTestData('empty-deployment.json');

      const result = await jsonToMarkdown(testData);

      expect(result).to.be.a('string');
      // Should not contain multiple consecutive newlines
      expect(result).to.not.match(/\n\s*\n\s*\n/);
    });
  });
});
