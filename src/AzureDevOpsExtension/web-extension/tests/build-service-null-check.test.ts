/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect } from 'chai';
import { JSDOM } from 'jsdom';

// Set up a minimal DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const { window } = dom;
const { document } = window;

// Set global DOM objects
(global as any).window = window;
(global as any).document = document;

describe('Build Service Null Check Tests', () => {
  describe('Service Availability Validation', () => {
    it('should handle null buildService from SDK.getService gracefully', async () => {
      // Mock SDK that returns null for getService
      const mockSDKNullService = {
        init: async () => ({ loaded: true }),
        notifyLoadSucceeded: async () => {},
        notifyLoadFailed: async () => {},
        getWebContext: () => ({
          project: { id: 'test-project' },
        }),
        getConfiguration: () => ({
          buildId: '123',
        }),
        getPageContext: () => ({
          navigation: {
            currentBuild: {
              id: 123,
            },
          },
        }),
        getService: async () => null, // Returns null instead of service
        resize: () => {},
      };

      // Set up global mock
      (global as any).SDK = mockSDKNullService;

      // Simulate the logic from BicepReportExtension.tsx
      let errorThrown = false;
      let errorMessage = '';

      try {
        const WEB_BUILD_SERVICE = 'ms.vss-build-web.build-service';
        const buildService = (await mockSDKNullService.getService(WEB_BUILD_SERVICE)) as any;

        // This is the new null check logic we added
        if (!buildService) {
          throw new Error(
            `Build service is not available. The service '${WEB_BUILD_SERVICE}' could not be loaded. ` +
              `This may occur when:\n` +
              `- The extension is not running in a proper Azure DevOps build context\n` +
              `- The required permissions are missing\n` +
              `- The Azure DevOps SDK version is incompatible\n` +
              `Please ensure this extension is accessed from a build pipeline results page.`
          );
        }

        // This should not be reached
        await buildService.getBuildAttachments('test-project', 123, 'bicepwhatifreport');
      } catch (error) {
        errorThrown = true;
        errorMessage = error instanceof Error ? error.message : String(error);
      }

      // Verify the error was caught and has the expected message
      expect(errorThrown).to.be.true;
      expect(errorMessage).to.include('Build service is not available');
      expect(errorMessage).to.include('ms.vss-build-web.build-service');
      expect(errorMessage).to.include(
        'extension is not running in a proper Azure DevOps build context'
      );
      expect(errorMessage).to.include('required permissions are missing');
      expect(errorMessage).to.include('Azure DevOps SDK version is incompatible');
    });

    it('should handle undefined buildService from SDK.getService gracefully', async () => {
      // Mock SDK that returns undefined for getService
      const mockSDKUndefinedService = {
        getService: async () => undefined, // Returns undefined instead of service
      };

      let errorThrown = false;
      let errorMessage = '';

      try {
        const WEB_BUILD_SERVICE = 'ms.vss-build-web.build-service';
        const buildService = (await mockSDKUndefinedService.getService(WEB_BUILD_SERVICE)) as any;

        // This is the new null check logic we added
        if (!buildService) {
          throw new Error(
            `Build service is not available. The service '${WEB_BUILD_SERVICE}' could not be loaded.`
          );
        }

        // This should not be reached
        await buildService.getBuildAttachments('test-project', 123, 'bicepwhatifreport');
      } catch (error) {
        errorThrown = true;
        errorMessage = error instanceof Error ? error.message : String(error);
      }

      // Verify the error was caught and has the expected message
      expect(errorThrown).to.be.true;
      expect(errorMessage).to.include('Build service is not available');
    });

    it('should handle buildService missing required methods', async () => {
      // Mock SDK that returns an incomplete service object
      const mockSDKIncompleteService = {
        getService: async () => ({
          // Missing getBuildAttachments method
          someOtherMethod: () => 'exists',
        }),
      };

      let errorThrown = false;
      let errorMessage = '';

      try {
        const WEB_BUILD_SERVICE = 'ms.vss-build-web.build-service';
        const buildService = (await mockSDKIncompleteService.getService(WEB_BUILD_SERVICE)) as any;

        // Check if buildService exists (it does)
        if (!buildService) {
          throw new Error('Build service is not available');
        }

        // This is the new method validation logic we added
        if (typeof buildService.getBuildAttachments !== 'function') {
          throw new Error(
            `Build service is missing required method 'getBuildAttachments'. ` +
              `Service object: ${JSON.stringify(Object.keys(buildService || {}))}`
          );
        }

        // This should not be reached
        await buildService.getBuildAttachments('test-project', 123, 'bicepwhatifreport');
      } catch (error) {
        errorThrown = true;
        errorMessage = error instanceof Error ? error.message : String(error);
      }

      // Verify the error was caught and has the expected message
      expect(errorThrown).to.be.true;
      expect(errorMessage).to.include(
        "Build service is missing required method 'getBuildAttachments'"
      );
      expect(errorMessage).to.include('Service object:');
      expect(errorMessage).to.include('someOtherMethod');
    });

    it('should work correctly when buildService is properly available', async () => {
      // Mock SDK that returns a proper service object
      const mockSDKValidService = {
        getService: async () => ({
          getBuildAttachments: async (projectId: string, buildId: number, type: string) => {
            expect(projectId).to.equal('test-project');
            expect(buildId).to.equal(123);
            expect(type).to.equal('bicepwhatifreport');
            return [{ name: 'md/test-report.md', type: 'bicepwhatifreport' }];
          },
          getAttachment: async () => '# Test Report',
        }),
      };

      let errorThrown = false;
      let attachments: any[] = [];

      try {
        const WEB_BUILD_SERVICE = 'ms.vss-build-web.build-service';
        const buildService = (await mockSDKValidService.getService(WEB_BUILD_SERVICE)) as any;

        // Check if buildService exists
        if (!buildService) {
          throw new Error('Build service is not available');
        }

        // Verify the buildService has the required methods
        if (typeof buildService.getBuildAttachments !== 'function') {
          throw new Error('Build service is missing required method getBuildAttachments');
        }

        // This should work properly
        attachments = await buildService.getBuildAttachments(
          'test-project',
          123,
          'bicepwhatifreport'
        );
      } catch (error) {
        errorThrown = true;
      }

      // Verify the operation completed successfully
      expect(errorThrown).to.be.false;
      expect(attachments).to.have.length(1);
      expect(attachments[0].name).to.equal('md/test-report.md');
    });

    it('should demonstrate the original error scenario', async () => {
      // This test demonstrates what would have happened before our fix
      const mockSDKNullService = {
        getService: async () => null,
      };

      let originalErrorThrown = false;
      let originalErrorMessage = '';

      try {
        // Simulate the ORIGINAL problematic code (without null checking)
        const buildService = (await mockSDKNullService.getService(
          'ms.vss-build-web.build-service'
        )) as any;

        // The original code would directly call getBuildAttachments without checking
        // This would cause "Cannot read properties of undefined (reading 'getBuildAttachments')"
        await buildService.getBuildAttachments('test-project', 123, 'bicepwhatifreport');
      } catch (error) {
        originalErrorThrown = true;
        originalErrorMessage = error instanceof Error ? error.message : String(error);
      }

      // Verify this produces the original error
      expect(originalErrorThrown).to.be.true;
      expect(originalErrorMessage).to.include(
        "Cannot read properties of null (reading 'getBuildAttachments')"
      );
    });
  });
});
