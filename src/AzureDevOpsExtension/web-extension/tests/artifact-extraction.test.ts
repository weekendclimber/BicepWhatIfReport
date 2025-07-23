/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import { getArtifactsFileEntries, getArtifactContentZip, ArtifactBuildRestClient } from '../src/build.getArtifactsFileEntries';
import * as JSZip from 'jszip';

// Set up a minimal DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const { window } = dom;

// Set global DOM objects
(global as any).window = window;
(global as any).document = window.document;

describe('Artifact File Extraction', () => {
  // Mock build client
  const mockBuildClient: ArtifactBuildRestClient = {
    getArtifacts: async (project: string, buildId: number) => {
      console.log(`Mock getArtifacts called with project: ${project}, buildId: ${buildId}`);
      return [
        {
          id: 1,
          name: 'bicep-reports',
          resource: {
            downloadUrl: 'https://mock.azure.com/artifacts/bicep-reports.zip',
          },
        },
        {
          id: 2,
          name: 'drop',
          resource: {
            downloadUrl: 'https://mock.azure.com/artifacts/drop.zip',
          },
        },
        {
          id: 3,
          name: 'test-logs',
          resource: {
            downloadUrl: 'https://mock.azure.com/artifacts/test-logs.zip',
          },
        },
      ] as any[];
    },
  };

  // Mock JSZip with test data
  const createMockZip = async (files: { [fileName: string]: string }): Promise<ArrayBuffer> => {
    const zip = new JSZip();
    
    Object.entries(files).forEach(([fileName, content]) => {
      zip.file(fileName, content);
    });
    
    return await zip.generateAsync({ type: 'arraybuffer' });
  };

  beforeEach(() => {
    // Mock global fetch for artifact downloads
    (global as any).fetch = async (url: string) => {
      console.log(`Mock fetch called with URL: ${url}`);
      
      if (url.includes('bicep-reports.zip')) {
        const mockFiles = {
          'bicep-reports/what-if-report.md': '# Bicep What-If Report\n\nThis is a mock report.',
          'bicep-reports/what-if-data.json': JSON.stringify({
            changes: [
              {
                changeType: 'Create',
                resourceId: '/subscriptions/test/resourceGroups/test/providers/Microsoft.Storage/storageAccounts/test',
                before: null,
                after: { kind: 'StorageV2' },
              },
            ],
          }),
        };
        const zipBuffer = await createMockZip(mockFiles);
        return {
          ok: true,
          status: 200,
          arrayBuffer: async () => zipBuffer,
        } as Response;
      } else if (url.includes('drop.zip')) {
        const mockFiles = {
          'drop/README.md': '# Build Output\n\nGeneral build artifacts.',
          'drop/bicep-analysis.json': JSON.stringify({
            analysis: 'Mock analysis data',
            timestamp: new Date().toISOString(),
          }),
        };
        const zipBuffer = await createMockZip(mockFiles);
        return {
          ok: true,
          status: 200,
          arrayBuffer: async () => zipBuffer,
        } as Response;
      } else if (url.includes('test-logs.zip')) {
        const mockFiles = {
          'test-logs/test.log': 'Test log content',
          'test-logs/results.xml': '<xml>Test results</xml>',
        };
        const zipBuffer = await createMockZip(mockFiles);
        return {
          ok: true,
          status: 200,
          arrayBuffer: async () => zipBuffer,
        } as Response;
      }
      
      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response;
    };

    // Mock getAccessToken
    (global as any).getAccessToken = async () => 'mock-access-token';
  });

  afterEach(() => {
    // Clean up mocks
    delete (global as any).fetch;
    delete (global as any).getAccessToken;
  });

  it('should extract relevant files from artifacts', async () => {
    const fileEntries = await getArtifactsFileEntries(mockBuildClient, 'test-project', 123);

    expect(fileEntries).to.be.an('array');
    expect(fileEntries.length).to.be.greaterThan(0);

    // Check that we found the expected files
    const fileNames = fileEntries.map(entry => entry.name);
    expect(fileNames).to.include('what-if-report.md');
    expect(fileNames).to.include('what-if-data.json');
    expect(fileNames).to.include('README.md');
    expect(fileNames).to.include('bicep-analysis.json');

    // Check file entry structure
    const mdFile = fileEntries.find(entry => entry.name === 'what-if-report.md');
    expect(mdFile).to.not.be.undefined;
    expect(mdFile!.artifactName).to.equal('bicep-reports');
    expect(mdFile!.buildId).to.equal(123);
    expect(mdFile!.contentsPromise).to.be.a('promise');

    // Test content loading
    const content = await mdFile!.contentsPromise;
    expect(content).to.equal('# Bicep What-If Report\n\nThis is a mock report.');
  });

  it('should filter artifacts by relevant names', async () => {
    const fileEntries = await getArtifactsFileEntries(mockBuildClient, 'test-project', 123);

    // Should include files from 'bicep-reports' and 'drop' artifacts
    // Should exclude files from 'test-logs' artifact (not relevant)
    const artifactNames = [...new Set(fileEntries.map(entry => entry.artifactName))];
    expect(artifactNames).to.include('bicep-reports');
    expect(artifactNames).to.include('drop');
    expect(artifactNames).to.not.include('test-logs'); // Should be filtered out
  });

  it('should filter files by relevant extensions', async () => {
    const fileEntries = await getArtifactsFileEntries(mockBuildClient, 'test-project', 123);

    // Should only include .md and .json files
    const extensions = fileEntries.map(entry => {
      const name = entry.name.toLowerCase();
      if (name.endsWith('.md') || name.endsWith('.markdown')) return 'markdown';
      if (name.endsWith('.json')) return 'json';
      return 'other';
    });

    expect(extensions).to.not.include('other');
    expect(extensions).to.include('markdown');
    expect(extensions).to.include('json');
  });

  it('should handle artifacts without downloadUrl gracefully', async () => {
    const mockClientWithoutUrl: ArtifactBuildRestClient = {
      getArtifacts: async () => [
        {
          id: 1,
          name: 'bicep-reports',
          resource: {}, // No downloadUrl
        },
      ] as any[],
    };

    const fileEntries = await getArtifactsFileEntries(mockClientWithoutUrl, 'test-project', 123);
    expect(fileEntries).to.be.an('array');
    expect(fileEntries.length).to.equal(0);
  });

  it('should handle download failures gracefully', async () => {
    // Mock fetch to return error
    (global as any).fetch = async () => ({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const fileEntries = await getArtifactsFileEntries(mockBuildClient, 'test-project', 123);
    expect(fileEntries).to.be.an('array');
    expect(fileEntries.length).to.equal(0);
  });

  it('should process JSON What-If data correctly', async () => {
    const fileEntries = await getArtifactsFileEntries(mockBuildClient, 'test-project', 123);
    
    const jsonFile = fileEntries.find(entry => entry.name === 'what-if-data.json');
    expect(jsonFile).to.not.be.undefined;

    const content = await jsonFile!.contentsPromise;
    const parsed = JSON.parse(content);
    expect(parsed).to.have.property('changes');
    expect(parsed.changes).to.be.an('array');
    expect(parsed.changes[0]).to.have.property('changeType', 'Create');
  });

  describe('getArtifactContentZip', () => {
    it('should download and return artifact content as ArrayBuffer', async () => {
      const mockFiles = {
        'test.md': '# Test Content',
      };
      const expectedBuffer = await createMockZip(mockFiles);

      (global as any).fetch = async () => ({
        ok: true,
        status: 200,
        arrayBuffer: async () => expectedBuffer,
      });

      const result = await getArtifactContentZip('https://mock.url/test.zip');
      expect(result).to.be.an('arraybuffer');
      expect(result!.byteLength).to.be.greaterThan(0);
    });

    it('should handle redirects', async () => {
      let callCount = 0;
      (global as any).fetch = async (_url: string) => {
        callCount++;
        if (callCount === 1) {
          return {
            status: 302,
            headers: {
              get: (name: string) => name === 'location' ? 'https://redirect.url/test.zip' : null,
            },
          };
        } else {
          const mockFiles = { 'test.md': '# Redirected Content' };
          const buffer = await createMockZip(mockFiles);
          return {
            ok: true,
            status: 200,
            arrayBuffer: async () => buffer,
          };
        }
      };

      const result = await getArtifactContentZip('https://mock.url/test.zip');
      expect(result).to.be.an('arraybuffer');
      expect(callCount).to.equal(2);
    });

    it('should return undefined for failed downloads', async () => {
      (global as any).fetch = async () => ({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await getArtifactContentZip('https://mock.url/missing.zip');
      expect(result).to.be.undefined;
    });
  });
});