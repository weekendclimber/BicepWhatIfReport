import { expect } from 'chai';
import { generateReport, jsonToMarkdown } from '../reports/generateReport';

describe('generateReport', () => {
  describe('generateReport function', () => {
    it('should generate a basic report for valid input', async () => {
      const testData = {
        changes: [
          {
            changeType: 'Create',
            resourceId:
              '/subscriptions/test/resourceGroups/test-rg/providers/Microsoft.Storage/storageAccounts/teststorage',
            after: {
              name: 'teststorage',
              type: 'Microsoft.Storage/storageAccounts',
              location: 'eastus',
              apiVersion: '2023-01-01',
              properties: {
                accessTier: 'Hot',
                supportsHttpsTrafficOnly: true,
              },
            },
          },
        ],
      };

      const result = await generateReport(testData);

      expect(result).to.be.a('string');
      expect(result).to.include('# Bicep What-If Report');
      expect(result).to.include('Resource Name: teststorage');
      expect(result).to.include('Change Type: Create');
      expect(result).to.include('Microsoft.Storage/storageAccounts');
    });

    it('should handle empty changes array', async () => {
      const testData = {
        changes: [],
      };

      const result = await generateReport(testData);

      expect(result).to.be.a('string');
      expect(result).to.include('# Bicep What-If Report');
    });

    it('should handle diagnostics if present', async () => {
      const testData = {
        changes: [],
        diagnostics: [
          {
            code: 'BCP001',
            level: 'Warning',
            target: '/subscriptions/test/resourceGroups/test-rg',
            message: 'Test diagnostic message',
            additionalInfo: 'Additional test info',
          },
        ],
      };

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
      const testData = {
        changes: [
          {
            changeType: 'Create',
            resourceId:
              '/subscriptions/test/resourceGroups/test-rg/providers/Microsoft.Storage/storageAccounts/teststorage',
            after: {
              name: 'teststorage',
              type: 'Microsoft.Storage/storageAccounts',
              location: 'eastus',
              apiVersion: '2023-01-01',
            },
          },
        ],
      };

      const result = await jsonToMarkdown(testData);

      expect(result).to.be.a('string');
      expect(result).to.include('# Bicep What-If Report');
      expect(result).to.include('## Resource Name: teststorage');
      expect(result).to.include('### Change Type: Create');
    });

    it('should handle Modify change type with delta', async () => {
      const testData = {
        changes: [
          {
            changeType: 'Modify',
            resourceId:
              '/subscriptions/test/resourceGroups/test-rg/providers/Microsoft.Compute/virtualMachines/testvm',
            delta: [
              {
                path: 'properties.hardwareProfile.vmSize',
                propertyChangeType: 'Modify',
                before: 'Standard_D2s_v3',
                after: 'Standard_D4s_v3',
              },
            ],
            after: {
              name: 'testvm',
              type: 'Microsoft.Compute/virtualMachines',
            },
          },
        ],
      };

      const result = await jsonToMarkdown(testData);

      expect(result).to.be.a('string');
      expect(result).to.include('### Change Details');
      expect(result).to.include('Standard_D2s_v3');
      expect(result).to.include('Standard_D4s_v3');
    });

    it('should handle Delete change type', async () => {
      const testData = {
        changes: [
          {
            changeType: 'Delete',
            resourceId:
              '/subscriptions/test/resourceGroups/test-rg/providers/Microsoft.Storage/storageAccounts/deleteme',
            after: {
              name: 'deleteme',
            },
          },
        ],
      };

      const result = await jsonToMarkdown(testData);

      expect(result).to.be.a('string');
      expect(result).to.include('## Resource Name: deleteme');
      expect(result).to.include('### Change Type: Delete');
    });

    it('should handle NoChange change type', async () => {
      const testData = {
        changes: [
          {
            changeType: 'NoChange',
            resourceId:
              '/subscriptions/test/resourceGroups/test-rg/providers/Microsoft.Network/virtualNetworks/testvnet',
            after: {
              name: 'testvnet',
              type: 'Microsoft.Network/virtualNetworks',
              location: 'eastus',
              properties: {
                addressSpace: {
                  addressPrefixes: ['10.0.0.0/16'],
                },
              },
            },
          },
        ],
      };

      const result = await jsonToMarkdown(testData);

      expect(result).to.be.a('string');
      expect(result).to.include('## Resource Name: testvnet');
      expect(result).to.include('### Change Type: NoChange');
      expect(result).to.include('10.0.0.0/16');
    });

    it('should handle Ignore change type', async () => {
      const testData = {
        changes: [
          {
            changeType: 'Ignore',
            resourceId:
              '/subscriptions/test/resourceGroups/test-rg/providers/Microsoft.Storage/storageAccounts/ignored',
            after: {
              name: 'ignored',
              type: 'Microsoft.Storage/storageAccounts',
            },
          },
        ],
      };

      const result = await jsonToMarkdown(testData);

      expect(result).to.be.a('string');
      expect(result).to.include('## Resource Name: ignored');
      expect(result).to.include('### Change Type: Ignore');
    });

    it('should handle Unsupported change type', async () => {
      const testData = {
        changes: [
          {
            changeType: 'Unsupported',
            resourceId:
              '/subscriptions/test/resourceGroups/test-rg/providers/Microsoft.Unknown/unknownResource/test',
            unsupportedReason: 'Resource type not supported',
            after: {
              name: 'test',
              type: 'Microsoft.Unknown/unknownResource',
              properties: {
                someProperty: 'value',
              },
            },
          },
        ],
      };

      const result = await jsonToMarkdown(testData);

      expect(result).to.be.a('string');
      expect(result).to.include('## Resource Name: test');
      expect(result).to.include('### Change Type: Unsupported');
      expect(result).to.include('Resource type not supported');
    });

    it('should handle unknown change types gracefully', async () => {
      const testData = {
        changes: [
          {
            changeType: 'UnknownType',
            resourceId:
              '/subscriptions/test/resourceGroups/test-rg/providers/Microsoft.Test/test/test',
            after: {
              name: 'test',
            },
          },
        ],
      };

      const result = await jsonToMarkdown(testData);

      expect(result).to.be.a('string');
      expect(result).to.include('### Unknown Change Type');
      expect(result).to.include('UnknownType');
    });

    it('should handle complex nested delta changes', async () => {
      const testData = {
        changes: [
          {
            changeType: 'Modify',
            resourceId:
              '/subscriptions/test/resourceGroups/test-rg/providers/Microsoft.Compute/virtualMachines/testvm',
            delta: [
              {
                path: 'properties.storageProfile.dataDisks',
                propertyChangeType: 'Array',
                children: [
                  {
                    path: '0',
                    propertyChangeType: 'Create',
                    after: {
                      diskSizeGB: 128,
                      lun: 0,
                    },
                  },
                ],
              },
            ],
            after: {
              name: 'testvm',
              type: 'Microsoft.Compute/virtualMachines',
            },
          },
        ],
      };

      const result = await jsonToMarkdown(testData);

      expect(result).to.be.a('string');
      expect(result).to.include('### Change Details');
      expect(result).to.include('Child Resource(s)');
      expect(result).to.include('diskSizeGB');
      expect(result).to.include('128');
    });

    it('should handle missing properties gracefully', async () => {
      const testData = {
        changes: [
          {
            changeType: 'Create',
            // Missing resourceId
            after: {
              // Missing name, type, location, apiVersion
            },
          },
        ],
      };

      const result = await jsonToMarkdown(testData);

      expect(result).to.be.a('string');
      expect(result).to.include('## Resource Name: Unnamed Resource');
      expect(result).to.include('Unknown Resource ID');
      expect(result).to.include('Unknown Location');
    });

    it('should remove blank lines from output', async () => {
      const testData = {
        changes: [],
      };

      const result = await jsonToMarkdown(testData);

      expect(result).to.be.a('string');
      // Should not contain multiple consecutive newlines
      expect(result).to.not.match(/\n\s*\n\s*\n/);
    });
  });
});
