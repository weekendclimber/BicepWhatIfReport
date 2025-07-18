import { expect } from 'chai';
import * as path from 'path';
import * as fs from 'fs';
import { parseWhatIfJson } from '../services/parseWhatIfJson';

// Mock Azure DevOps task library for testing
const mockTl = {
  debug: (message: string) => console.log(`DEBUG: ${message}`),
  setResult: (result: any, message: string) => console.log(`RESULT: ${result} - ${message}`),
  TaskResult: {
    Failed: 'Failed',
    Succeeded: 'Succeeded',
  },
};

// Replace the module require with our mock
import tl = require('azure-pipelines-task-lib/task');
Object.assign(tl, mockTl);

describe('parseWhatIfJson', () => {
  const testDataDir = path.join(__dirname, 'test-data');

  describe('Valid JSON parsing', () => {
    it('should parse minimal valid JSON successfully', async () => {
      const filePath = path.join(testDataDir, 'minimal-valid.json');
      const result = await parseWhatIfJson(filePath);

      expect(result).to.be.an('object');
      expect(result).to.have.property('changes');
      expect((result as any).changes).to.be.an('array');
      expect((result as any).changes).to.have.lengthOf(1);
      expect((result as any).changes[0]).to.have.property('changeType', 'Create');
    });

    it('should parse all change types correctly', async () => {
      const filePath = path.join(testDataDir, 'all-change-types.json');
      const result = await parseWhatIfJson(filePath);

      expect(result).to.be.an('object');
      expect(result).to.have.property('changes');
      const changes = (result as any).changes;
      expect(changes).to.be.an('array');
      expect(changes).to.have.lengthOf(6);

      // Verify all change types are present
      const changeTypes = changes.map((change: any) => change.changeType);
      expect(changeTypes).to.include.members([
        'Create',
        'Modify',
        'Delete',
        'NoChange',
        'Ignore',
        'Unsupported',
      ]);
    });

    it('should parse empty deployment JSON', async () => {
      const filePath = path.join(testDataDir, 'empty-deployment.json');
      const result = await parseWhatIfJson(filePath);

      expect(result).to.be.an('object');
      expect(result).to.have.property('changes');
      expect((result as any).changes).to.be.an('array');
      expect((result as any).changes).to.have.lengthOf(0);
    });

    it('should parse complex nested JSON structures', async () => {
      const filePath = path.join(testDataDir, 'complex-nested.json');
      const result = await parseWhatIfJson(filePath);

      expect(result).to.be.an('object');
      expect(result).to.have.property('changes');
      const changes = (result as any).changes;
      expect(changes).to.be.an('array');
      expect(changes).to.have.lengthOf(1);

      const change = changes[0];
      expect(change).to.have.property('after');
      expect(change.after).to.have.property('properties');
      expect(change.after.properties).to.have.property('encryption');
      expect(change.after.properties).to.have.property('networkAcls');
      expect(change.after.properties).to.have.property('tags');
    });

    it('should parse JSON with Unicode characters', async () => {
      const filePath = path.join(testDataDir, 'unicode-content.json');
      const result = await parseWhatIfJson(filePath);

      expect(result).to.be.an('object');
      expect(result).to.have.property('changes');
      const changes = (result as any).changes;
      expect(changes).to.be.an('array');
      expect(changes).to.have.lengthOf(1);

      const tags = changes[0].after.tags;
      expect(tags.Description).to.include('测试存储账户');
      expect(tags.Description).to.include('🚀');
      expect(tags.Project).to.equal('Διεθνές έργο');
      expect(tags.Unicode).to.equal('こんにちは世界');
    });

    it('should parse JSON with errors structure', async () => {
      const filePath = path.join(testDataDir, 'with-errors.json');
      const result = await parseWhatIfJson(filePath);

      expect(result).to.be.an('object');
      expect(result).to.have.property('error');
      expect((result as any).error).to.have.property('code', 'DeploymentValidationFailed');
      expect((result as any).error).to.have.property('details');
      expect((result as any).error.details).to.be.an('array');
    });
  });

  describe('Error handling', () => {
    it('should throw error for non-existent file', async () => {
      const filePath = path.join(testDataDir, 'non-existent-file.json');

      try {
        await parseWhatIfJson(filePath);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('error');
        expect((error as Error).message).to.include('The file does not exist');
      }
    });

    it('should handle files with BOM correctly', async () => {
      // Create test file with BOM
      const bomFilePath = path.join(testDataDir, 'bom-test.json');
      const jsonContent =
        '{\n  "changes": [\n    {\n      "changeType": "Create",\n      "resourceId": "/test/resource"\n    }\n  ]\n}';
      const bomContent = '\uFEFF' + jsonContent;

      fs.writeFileSync(bomFilePath, bomContent, 'utf8');

      try {
        const result = await parseWhatIfJson(bomFilePath);
        expect(result).to.be.an('object');
        expect(result).to.have.property('changes');
        expect((result as any).changes).to.be.an('array');
        expect((result as any).changes).to.have.lengthOf(1);
        expect((result as any).changes[0]).to.have.property('changeType', 'Create');
      } finally {
        // Clean up
        if (fs.existsSync(bomFilePath)) {
          fs.unlinkSync(bomFilePath);
        }
      }
    });

    it('should handle files with leading whitespace correctly', async () => {
      // Create test file with leading whitespace
      const whitespaceFilePath = path.join(testDataDir, 'whitespace-test.json');
      const jsonContent =
        '{\n  "changes": [\n    {\n      "changeType": "Create",\n      "resourceId": "/test/resource"\n    }\n  ]\n}';
      const whitespaceContent = '   \n\t' + jsonContent;

      fs.writeFileSync(whitespaceFilePath, whitespaceContent, 'utf8');

      try {
        const result = await parseWhatIfJson(whitespaceFilePath);
        expect(result).to.be.an('object');
        expect(result).to.have.property('changes');
        expect((result as any).changes).to.be.an('array');
        expect((result as any).changes).to.have.lengthOf(1);
        expect((result as any).changes[0]).to.have.property('changeType', 'Create');
      } finally {
        // Clean up
        if (fs.existsSync(whitespaceFilePath)) {
          fs.unlinkSync(whitespaceFilePath);
        }
      }
    });

    it('should throw error for empty file', async () => {
      const filePath = path.join(testDataDir, 'empty-file.json');

      try {
        await parseWhatIfJson(filePath);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('error');
        expect((error as Error).message).to.include('Failed to parse what-if JSON');
      }
    });

    it('should throw error for malformed JSON', async () => {
      const filePath = path.join(testDataDir, 'malformed-syntax.json');

      try {
        await parseWhatIfJson(filePath);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('error');
        expect((error as Error).message).to.include('Failed to parse what-if JSON');
      }
    });

    it('should handle file permission errors gracefully', async () => {
      // Create a temporary file with no read permissions
      const tempFilePath = path.join(testDataDir, 'no-permission.json');
      fs.writeFileSync(tempFilePath, '{"test": "data"}');
      fs.chmodSync(tempFilePath, 0o000);

      try {
        await parseWhatIfJson(tempFilePath);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('error');
        expect((error as Error).message).to.include('Failed to parse what-if JSON');
      } finally {
        // Clean up - restore permissions and delete file
        try {
          fs.chmodSync(tempFilePath, 0o644);
          fs.unlinkSync(tempFilePath);
        } catch (cleanupError) {
          // Ignore cleanup errors in test
        }
      }
    });

    it('should handle invalid file paths', async () => {
      const invalidPaths = ['', '   ', '/invalid/path/to/file.json', 'relative/path.json'];

      for (const invalidPath of invalidPaths) {
        try {
          await parseWhatIfJson(invalidPath);
          expect.fail(`Should have thrown an error for path: ${invalidPath}`);
        } catch (error) {
          expect(error).to.be.an('error');
          expect((error as Error).message).to.include('The file does not exist');
        }
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle very large JSON files', async function () {
      this.timeout(10000); // Increase timeout for large file test

      // Create a large JSON file with many changes
      const largeJsonPath = path.join(testDataDir, 'large-file.json');
      const largeData = {
        changes: Array.from({ length: 1000 }, (_, i) => ({
          changeType: 'Create',
          resourceId: `/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/test-rg/providers/Microsoft.Storage/storageAccounts/storage${i}`,
          before: null,
          after: {
            apiVersion: '2023-01-01',
            type: 'Microsoft.Storage/storageAccounts',
            name: `storage${i}`,
            location: 'eastus',
            properties: {
              accountType: 'Standard_LRS',
            },
          },
        })),
      };

      fs.writeFileSync(largeJsonPath, JSON.stringify(largeData));

      try {
        const result = await parseWhatIfJson(largeJsonPath);
        expect(result).to.be.an('object');
        expect(result).to.have.property('changes');
        expect((result as any).changes).to.have.lengthOf(1000);
      } finally {
        // Clean up
        if (fs.existsSync(largeJsonPath)) {
          fs.unlinkSync(largeJsonPath);
        }
      }
    });

    it('should handle deeply nested JSON structures', async () => {
      // Create a deeply nested JSON structure
      const deepNestedPath = path.join(testDataDir, 'deep-nested.json');
      let deepObject: any = {};
      let current = deepObject;

      // Create 50 levels of nesting
      for (let i = 0; i < 50; i++) {
        current.level = i;
        current.next = {};
        current = current.next;
      }
      current.final = 'value';

      const deepData = {
        changes: [
          {
            changeType: 'Create',
            resourceId: '/test/resource',
            before: null,
            after: {
              deepProperty: deepObject,
            },
          },
        ],
      };

      fs.writeFileSync(deepNestedPath, JSON.stringify(deepData));

      try {
        const result = await parseWhatIfJson(deepNestedPath);
        expect(result).to.be.an('object');
        expect(result).to.have.property('changes');
        expect((result as any).changes).to.have.lengthOf(1);
      } finally {
        // Clean up
        if (fs.existsSync(deepNestedPath)) {
          fs.unlinkSync(deepNestedPath);
        }
      }
    });

    it('should handle JSON with null and undefined values', async () => {
      const nullValuesPath = path.join(testDataDir, 'null-values.json');
      const nullData = {
        changes: [
          {
            changeType: 'Delete',
            resourceId: '/test/resource',
            before: {
              name: 'test',
              value: null,
              empty: undefined,
            },
            after: null,
          },
        ],
      };

      fs.writeFileSync(nullValuesPath, JSON.stringify(nullData));

      try {
        const result = await parseWhatIfJson(nullValuesPath);
        expect(result).to.be.an('object');
        expect(result).to.have.property('changes');
        expect((result as any).changes).to.have.lengthOf(1);
        expect((result as any).changes[0].after).to.be.null;
      } finally {
        // Clean up
        if (fs.existsSync(nullValuesPath)) {
          fs.unlinkSync(nullValuesPath);
        }
      }
    });
  });

  describe('Performance tests', () => {
    it('should parse JSON files within reasonable time limits', async function () {
      this.timeout(5000); // 5 second timeout

      const startTime = Date.now();
      const filePath = path.join(testDataDir, 'complex-nested.json');

      await parseWhatIfJson(filePath);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).to.be.lessThan(1000); // Should complete within 1 second
    });

    it('should handle multiple concurrent file reads', async function () {
      this.timeout(10000);

      const filePath = path.join(testDataDir, 'minimal-valid.json');

      // Create 10 concurrent parse operations
      const promises = Array.from({ length: 10 }, () => parseWhatIfJson(filePath));

      const results = await Promise.all(promises);

      expect(results).to.have.lengthOf(10);
      results.forEach(result => {
        expect(result).to.be.an('object');
        expect(result).to.have.property('changes');
      });
    });
  });
});
