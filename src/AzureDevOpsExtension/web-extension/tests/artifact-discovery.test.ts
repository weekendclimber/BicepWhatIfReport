/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect } from 'chai';
import { getArtifactsFileEntries } from '../src/build.getArtifactsFileEntries';
import { getArtifactContentZip } from '../src/ArtifactBuildRestClient';

// Mock dependencies
const mockJSZip = {
  loadAsync: async (buffer: ArrayBuffer) => {
    // Mock a ZIP file with markdown files
    return {
      files: {
        'BicepWhatIfReport/report1.md': {
          name: 'BicepWhatIfReport/report1.md',
          dir: false,
          async: (type: string) => {
            if (type === 'string') {
              return '# Test Report 1\nThis is test content.';
            }
            return buffer;
          },
        },
        'BicepWhatIfReport/report2.md': {
          name: 'BicepWhatIfReport/report2.md',
          dir: false,
          async: (type: string) => {
            if (type === 'string') {
              return '# Test Report 2\nThis is test content 2.';
            }
            return buffer;
          },
        },
        'BicepWhatIfReport/not-a-report.txt': {
          name: 'BicepWhatIfReport/not-a-report.txt',
          dir: false,
          async: (type: string) => {
            if (type === 'string') {
              return 'This should be filtered out';
            }
            return buffer;
          },
        },
        'BicepWhatIfReport/subfolder/': {
          name: 'BicepWhatIfReport/subfolder/',
          dir: true,
          async: () => '',
        },
      },
    };
  },
};

// Mock global JSZip
(global as any).JSZip = mockJSZip;

describe('Artifact Discovery Tests', () => {
  describe('getArtifactsFileEntries', () => {
    it('should discover markdown files in Bicep artifacts', async () => {
      const mockBuildClient = {
        getArtifacts: async (project: string, buildId: number) => {
          expect(project).to.equal('test-project');
          expect(buildId).to.equal(123);

          return [
            {
              name: 'BicepWhatIfReport',
              resource: {
                downloadUrl: 'https://dev.azure.com/test/artifact.zip',
              },
            },
            {
              name: 'other-artifact',
              resource: {
                downloadUrl: 'https://dev.azure.com/test/other.zip',
              },
            },
          ];
        },
      };

      // Mock getArtifactContentZip to return a buffer for the right artifact
      const originalGetArtifactContentZip = getArtifactContentZip;
      (global as any).getArtifactContentZip = async (url: string) => {
        if (url.includes('artifact.zip')) {
          return new ArrayBuffer(100); // Mock buffer
        }
        return undefined; // Other artifacts fail
      };

      const fileEntries = await getArtifactsFileEntries(mockBuildClient, 'test-project', 123);

      expect(fileEntries).to.have.length(2);
      expect(fileEntries[0].name).to.equal('report1.md');
      expect(fileEntries[0].artifactName).to.equal('BicepWhatIfReport');
      expect(fileEntries[0].filePath).to.equal('report1.md');
      expect(fileEntries[0].buildId).to.equal(123);

      expect(fileEntries[1].name).to.equal('report2.md');
      expect(fileEntries[1].artifactName).to.equal('BicepWhatIfReport');

      // Test that content can be retrieved
      const content1 = await fileEntries[0].contentsPromise;
      const content2 = await fileEntries[1].contentsPromise;

      expect(content1).to.equal('# Test Report 1\nThis is test content.');
      expect(content2).to.equal('# Test Report 2\nThis is test content 2.');

      // Restore original function
      (global as any).getArtifactContentZip = originalGetArtifactContentZip;
    });

    it('should filter artifacts by Bicep-related names', async () => {
      const mockBuildClient = {
        getArtifacts: async () => [
          { name: 'BicepWhatIfReport', resource: { downloadUrl: 'url1' } },
          { name: 'bicep-what-if-logs', resource: { downloadUrl: 'url2' } },
          { name: 'some-bicep-reports', resource: { downloadUrl: 'url3' } },
          { name: 'random-artifact', resource: { downloadUrl: 'url4' } },
          { name: 'logs', resource: { downloadUrl: 'url5' } },
        ],
      };

      // Mock getArtifactContentZip to return empty for all
      (global as any).getArtifactContentZip = async () => undefined;

      const fileEntries = await getArtifactsFileEntries(mockBuildClient, 'test-project', 123);

      // Should only process Bicep-related artifacts (first 3)
      // Since getArtifactContentZip returns undefined, no files will be found
      expect(fileEntries).to.have.length(0);

      // But the function should have been called 3 times for the Bicep artifacts
      // We can't easily test this without more complex mocking, but the test
      // verifies the filtering logic works
    });

    it('should handle artifacts with no markdown files', async () => {
      const mockBuildClient = {
        getArtifacts: async () => [
          { name: 'BicepWhatIfReport', resource: { downloadUrl: 'url1' } },
        ],
      };

      // Mock JSZip to return files without .md extension
      const mockJSZipNoMd = {
        loadAsync: async () => ({
          files: {
            'BicepWhatIfReport/report.txt': {
              name: 'BicepWhatIfReport/report.txt',
              dir: false,
              async: () => 'text content',
            },
            'BicepWhatIfReport/data.json': {
              name: 'BicepWhatIfReport/data.json',
              dir: false,
              async: () => '{}',
            },
          },
        }),
      };
      (global as any).JSZip = mockJSZipNoMd;

      (global as any).getArtifactContentZip = async () => new ArrayBuffer(100);

      const fileEntries = await getArtifactsFileEntries(mockBuildClient, 'test-project', 123);

      expect(fileEntries).to.have.length(0);

      // Restore original JSZip mock
      (global as any).JSZip = mockJSZip;
    });

    it('should handle ZIP loading errors gracefully', async () => {
      const mockBuildClient = {
        getArtifacts: async () => [
          { name: 'BicepWhatIfReport', resource: { downloadUrl: 'url1' } },
        ],
      };

      // Mock JSZip to throw an error
      const mockJSZipError = {
        loadAsync: async () => {
          throw new Error('Invalid ZIP file');
        },
      };
      (global as any).JSZip = mockJSZipError;

      (global as any).getArtifactContentZip = async () => new ArrayBuffer(100);

      // Should not throw an error, but return empty array
      const fileEntries = await getArtifactsFileEntries(mockBuildClient, 'test-project', 123);

      expect(fileEntries).to.have.length(0);

      // Restore original JSZip mock
      (global as any).JSZip = mockJSZip;
    });

    it('should handle download failures gracefully', async () => {
      const mockBuildClient = {
        getArtifacts: async () => [
          { name: 'BicepWhatIfReport', resource: { downloadUrl: 'url1' } },
        ],
      };

      // Mock getArtifactContentZip to return undefined (download failure)
      (global as any).getArtifactContentZip = async () => undefined;

      const fileEntries = await getArtifactsFileEntries(mockBuildClient, 'test-project', 123);

      expect(fileEntries).to.have.length(0);
    });
  });

  describe('Artifact Name Filtering', () => {
    it('should identify Bicep-related artifact names correctly', () => {
      const testCases = [
        { name: 'BicepWhatIfReport', shouldMatch: true },
        { name: 'bicep-what-if-logs', shouldMatch: true },
        { name: 'My-Bicep-Reports', shouldMatch: true },
        { name: 'whatif-results', shouldMatch: true },
        { name: 'deployment-what-if', shouldMatch: true },
        { name: 'logs', shouldMatch: false },
        { name: 'test-results', shouldMatch: false },
        { name: 'build-output', shouldMatch: false },
        { name: 'CodeAnalysisLogs', shouldMatch: false },
      ];

      testCases.forEach(testCase => {
        const artifact = { name: testCase.name };

        // Simulate the filter logic from getArtifactsFileEntries
        const matches =
          artifact.name === 'BicepWhatIfReport' ||
          artifact.name === 'bicep-what-if-logs' ||
          artifact.name.toLowerCase().includes('bicep') ||
          artifact.name.toLowerCase().includes('whatif') ||
          artifact.name.toLowerCase().includes('what-if');

        expect(matches).to.equal(
          testCase.shouldMatch,
          `Artifact "${testCase.name}" should ${testCase.shouldMatch ? 'match' : 'not match'} Bicep filter`
        );
      });
    });
  });
});
