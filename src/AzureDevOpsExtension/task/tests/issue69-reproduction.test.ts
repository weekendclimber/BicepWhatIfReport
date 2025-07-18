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

describe('Issue #69 - PowerShell Set-Content -Encoding utf8 specific reproduction', () => {
  const testDir = '/tmp/issue-69-test';

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should handle the exact scenario from issue #69 - PowerShell Set-Content -Encoding utf8', async () => {
    // Create the exact JSON content that would be generated by Bicep what-if
    const jsonContent = {
      changes: [
        {
          changeType: 'Create',
          resourceId:
            '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/test-rg/providers/Microsoft.Storage/storageAccounts/teststorage001',
          before: null,
          after: {
            apiVersion: '2023-01-01',
            type: 'Microsoft.Storage/storageAccounts',
            name: 'teststorage001',
            location: 'eastus',
            properties: {
              accountType: 'Standard_LRS',
            },
          },
        },
      ],
    };

    // Convert to JSON string and simulate PowerShell Set-Content -Encoding utf8 output
    const jsonString = JSON.stringify(jsonContent, null, 2);

    // Test various scenarios that PowerShell Set-Content -Encoding utf8 can produce
    const testCases = [
      {
        name: 'PowerShell UTF-8 BOM with quotes issue',
        content: '\uFEFF' + jsonString,
        description: 'UTF-8 BOM added by PowerShell Set-Content -Encoding utf8',
      },
      {
        name: 'PowerShell with control characters',
        content: '\u0000\u0001' + jsonString,
        description: 'Control characters that can be introduced by PowerShell encoding',
      },
      {
        name: 'PowerShell with mixed encoding artifacts',
        content: '\uFEFF\u0000' + jsonString + '\u0000',
        description: 'Mixed BOM and control characters',
      },
      {
        name: 'PowerShell with zero-width characters',
        content: '\u200B\u200C' + jsonString,
        description: 'Zero-width characters that can cause parsing issues',
      },
      {
        name: 'PowerShell with all encoding issues combined',
        content: '\uFEFF\u0000\u0001\u200B   \n\t' + jsonString + '\u0000\n   ',
        description: 'The worst-case scenario combining all encoding issues',
      },
    ];

    console.log('\nTesting PowerShell Set-Content -Encoding utf8 scenarios:');

    for (const testCase of testCases) {
      console.log(`\n  Testing: ${testCase.name}`);
      console.log(`  Description: ${testCase.description}`);

      const testFilePath = path.join(
        testDir,
        `${testCase.name.replace(/\s+/g, '-').toLowerCase()}.json`
      );

      // Write the file with the problematic content
      fs.writeFileSync(testFilePath, testCase.content, 'utf8');

      try {
        // This should now work without throwing the "Unexpected token" error
        const result = await parseWhatIfJson(testFilePath);

        // Verify the result is correct
        expect(result).to.be.an('object');
        expect(result).to.have.property('changes');
        expect((result as any).changes).to.be.an('array');
        expect((result as any).changes).to.have.lengthOf(1);
        expect((result as any).changes[0]).to.have.property('changeType', 'Create');
        expect((result as any).changes[0]).to.have.property('resourceId');
        expect((result as any).changes[0].resourceId).to.include('teststorage001');

        console.log(`  ✓ Successfully parsed ${testCase.name}`);
      } catch (error) {
        console.log(`  ✗ Failed to parse ${testCase.name}: ${(error as Error).message}`);
        throw error;
      }
    }
  });

  it('should handle the exact error message pattern from issue #69', async () => {
    // Reproduce the exact scenario that was causing:
    // "Error: Failed to parse what-if JSON: Unexpected token '', "{ "c"... is not valid JSON"

    const jsonContent = {
      changes: [
        {
          changeType: 'Create',
          resourceId: '/test/resource',
        },
      ],
    };

    const jsonString = JSON.stringify(jsonContent);

    // Create content that would produce the specific error pattern
    // The error suggests there was an invalid character at the start
    const problematicContent = '\uFEFF\u0000' + jsonString;

    const testFilePath = path.join(testDir, 'issue-69-reproduction.json');
    fs.writeFileSync(testFilePath, problematicContent, 'utf8');

    // This should now work without the "Unexpected token" error
    const result = await parseWhatIfJson(testFilePath);

    expect(result).to.be.an('object');
    expect(result).to.have.property('changes');
    expect((result as any).changes).to.be.an('array');
    expect((result as any).changes).to.have.lengthOf(1);
    expect((result as any).changes[0]).to.have.property('changeType', 'Create');

    console.log('✓ Successfully handled the exact error pattern from issue #69');
  });

  it('should handle file reading failures gracefully with fallback to binary reading', async () => {
    // Test the enhanced file reading logic that was added to handle BOM issues at the file level
    const jsonContent = {
      changes: [
        {
          changeType: 'Create',
          resourceId: '/test/resource',
        },
      ],
    };

    const jsonString = JSON.stringify(jsonContent);

    // Create a buffer with potential encoding issues
    const problematicBuffer = Buffer.concat([
      Buffer.from([0xef, 0xbb, 0xbf]), // UTF-8 BOM
      Buffer.from([0x00]), // null byte
      Buffer.from(jsonString, 'utf8'),
    ]);

    const testFilePath = path.join(testDir, 'binary-fallback-test.json');
    fs.writeFileSync(testFilePath, problematicBuffer);

    // This should use the fallback binary reading mechanism
    const result = await parseWhatIfJson(testFilePath);

    expect(result).to.be.an('object');
    expect(result).to.have.property('changes');
    expect((result as any).changes).to.be.an('array');
    expect((result as any).changes).to.have.lengthOf(1);
    expect((result as any).changes[0]).to.have.property('changeType', 'Create');

    console.log('✓ Successfully handled file reading with binary fallback');
  });
});
