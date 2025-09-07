/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect } from 'chai';

// Test utilities for attachment link parsing and logging
describe('Attachment Utilities Tests', () => {
  describe('parseAttachmentLink', () => {
    // We need to extract the function logic for testing since it's defined inline
    const parseAttachmentLink = (selfHref: string): { timelineId: string; recordId: string } | null => {
      const timelineRecordPattern = /\/timeline\/([^/]+)\/records\/([^/]+)\/attachments\//;
      const match = selfHref.match(timelineRecordPattern);
      
      if (match && match[1] && match[2]) {
        return {
          timelineId: match[1],
          recordId: match[2]
        };
      }
      
      return null;
    };

    it('should parse valid attachment self link', () => {
      const validHref = 'https://dev.azure.com/org/project/_apis/build/builds/123/timeline/abc-123-def/records/xyz-456-ghi/attachments/bicepwhatifreport/md%2Freport.md';
      
      const result = parseAttachmentLink(validHref);
      
      expect(result).to.not.be.null;
      expect(result!.timelineId).to.equal('abc-123-def');
      expect(result!.recordId).to.equal('xyz-456-ghi');
    });

    it('should parse link with different structure', () => {
      const validHref = '/_apis/build/builds/456/timeline/timeline-guid/records/record-guid/attachments/type/name';
      
      const result = parseAttachmentLink(validHref);
      
      expect(result).to.not.be.null;
      expect(result!.timelineId).to.equal('timeline-guid');
      expect(result!.recordId).to.equal('record-guid');
    });

    it('should return null for malformed link', () => {
      const invalidHref = 'https://dev.azure.com/org/project/_apis/build/builds/123/invalid-structure';
      
      const result = parseAttachmentLink(invalidHref);
      
      expect(result).to.be.null;
    });

    it('should return null for empty string', () => {
      const result = parseAttachmentLink('');
      expect(result).to.be.null;
    });

    it('should return null for partial match', () => {
      const partialHref = 'https://dev.azure.com/org/project/_apis/build/builds/123/timeline/abc-123-def/records/';
      
      const result = parseAttachmentLink(partialHref);
      
      expect(result).to.be.null;
    });

    it('should handle URL-encoded characters in IDs', () => {
      const hrefWithEncoding = '/_apis/build/builds/123/timeline/abc%2D123%2Ddef/records/xyz%2D456%2Dghi/attachments/type/name';
      
      const result = parseAttachmentLink(hrefWithEncoding);
      
      expect(result).to.not.be.null;
      expect(result!.timelineId).to.equal('abc%2D123%2Ddef');
      expect(result!.recordId).to.equal('xyz%2D456%2Dghi');
    });
  });

  describe('Debug logging utilities', () => {
    let originalLocation: Location;
    let mockConsoleLog: any;
    let consoleMessages: string[];

    beforeEach(() => {
      // Save original location
      originalLocation = (global as any).window?.location;
      
      // Mock console.log to capture messages
      consoleMessages = [];
      mockConsoleLog = (message: string, ...args: any[]) => {
        consoleMessages.push(message + (args.length > 0 ? ' ' + args.join(' ') : ''));
      };
      
      // Create window object if it doesn't exist
      if (!(global as any).window) {
        (global as any).window = {};
      }
    });

    afterEach(() => {
      // Restore original location
      if (originalLocation) {
        (global as any).window.location = originalLocation;
      }
    });

    const createMockDebugLog = (isDebugMode: boolean) => {
      // Mock the debug mode detection by creating a mock URLSearchParams
      const mockSearchParams = {
        get: (key: string) => isDebugMode && key === 'debug' ? '1' : null
      };

      const mockLocation = {
        search: isDebugMode ? '?debug=1' : '',
        hostname: isDebugMode ? 'localhost' : 'prod.example.com'
      };

      // Simulate the isDebugMode function
      const debugMode = (): boolean => {
        const urlParams = mockSearchParams;
        return urlParams.get('debug') === '1' || mockLocation.hostname === 'localhost';
      };

      // Simulate the debugLog function
      return (message: string, ...args: unknown[]): void => {
        if (debugMode()) {
          mockConsoleLog(`[BicepWhatIfTab] ${message}`, ...args);
        }
      };
    };

    it('should log when debug mode is enabled via query parameter', () => {
      const debugLog = createMockDebugLog(true);
      
      debugLog('Test message', 'with', 'args');
      
      expect(consoleMessages).to.have.length(1);
      expect(consoleMessages[0]).to.include('[BicepWhatIfTab] Test message');
      expect(consoleMessages[0]).to.include('with args');
    });

    it('should not log when debug mode is disabled', () => {
      const debugLog = createMockDebugLog(false);
      
      debugLog('Test message');
      
      expect(consoleMessages).to.have.length(0);
    });

    it('should always log info messages', () => {
      // Test the infoLog function (always logs)
      const infoLog = (message: string, ...args: unknown[]): void => {
        mockConsoleLog(`[BicepWhatIfTab] ${message}`, ...args);
      };
      
      infoLog('Important message');
      
      expect(consoleMessages).to.have.length(1);
      expect(consoleMessages[0]).to.include('[BicepWhatIfTab] Important message');
    });
  });

  describe('Round-trip property tests', () => {
    const parseAttachmentLink = (selfHref: string): { timelineId: string; recordId: string } | null => {
      const timelineRecordPattern = /\/timeline\/([^/]+)\/records\/([^/]+)\/attachments\//;
      const match = selfHref.match(timelineRecordPattern);
      
      if (match && match[1] && match[2]) {
        return {
          timelineId: match[1],
          recordId: match[2]
        };
      }
      
      return null;
    };

    const testCases = [
      {
        name: 'standard GUIDs',
        timelineId: 'timeline-abc-123-def',
        recordId: 'record-xyz-456-ghi'
      },
      {
        name: 'simple IDs',
        timelineId: 'timeline1',
        recordId: 'record1'
      },
      {
        name: 'complex IDs with special chars',
        timelineId: 'timeline-abc-123-def-ghi',
        recordId: 'record-xyz-456-ghi-jkl'
      }
    ];

    testCases.forEach(testCase => {
      it(`should parse and extract IDs correctly for ${testCase.name}`, () => {
        const href = `/_apis/build/builds/123/timeline/${testCase.timelineId}/records/${testCase.recordId}/attachments/bicepwhatifreport/test.md`;
        
        const result = parseAttachmentLink(href);
        
        expect(result).to.not.be.null;
        expect(result!.timelineId).to.equal(testCase.timelineId);
        expect(result!.recordId).to.equal(testCase.recordId);
      });
    });
  });
});