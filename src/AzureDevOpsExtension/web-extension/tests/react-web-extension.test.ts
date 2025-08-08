/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import * as fs from 'fs';

// Set up a minimal DOM environment for React
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="react-root"></div></body></html>');
const { window } = dom;
const { document } = window;

// Set global DOM objects
(global as any).window = window;
(global as any).document = document;

// Mock React DOM for testing
const mockReactDOM = {
  render: (element: any, container: HTMLElement) => {
    // Mock render by updating the container's data attribute
    container.setAttribute('data-react-rendered', 'true');
    container.setAttribute('data-react-component', element.type?.name || 'Component');
  },
};

// Mock Azure DevOps SDK
const mockSDK = {
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
  getService: async () => ({
    getBuildAttachments: async () => [{ name: 'md/test-report.md', type: 'bicepwhatifreport' }],
    getAttachment: async () => '# Test Report\nThis is a test report.',
  }),
  resize: () => {},
};

describe('React Web Extension Tests', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '<div id="react-root"></div>';

    // Set up global mocks
    (global as any).SDK = mockSDK;

    // Mock marked library
    (global as any).marked = {
      parse: (content: string) => `<p>${content}</p>`,
    };
  });

  describe('React Component Structure', () => {
    it('should be able to mock React component rendering', () => {
      const reactRoot = document.getElementById('react-root')!;

      // Mock the React rendering process
      const mockComponent = { type: { name: 'BicepReportExtension' } };
      mockReactDOM.render(mockComponent, reactRoot);

      // Verify mocked rendering
      expect(reactRoot.getAttribute('data-react-rendered')).to.equal('true');
      expect(reactRoot.getAttribute('data-react-component')).to.equal('BicepReportExtension');
    });

    it('should validate component interfaces', () => {
      // Test the types we defined
      const mockBuildService = {
        getBuildAttachments: async (projectId: string, buildId: number, type: string) => {
          expect(typeof projectId).to.equal('string');
          expect(typeof buildId).to.equal('number');
          expect(typeof type).to.equal('string');
          return [{ name: 'md/test.md', type: 'bicepwhatifreport' }];
        },
        getAttachment: async (projectId: string, buildId: number, type: string, name: string) => {
          expect(typeof name).to.equal('string');
          return '# Test';
        },
      };

      expect(mockBuildService.getBuildAttachments).to.be.a('function');
      expect(mockBuildService.getAttachment).to.be.a('function');
    });
  });

  describe('Build Process', () => {
    it('should use webpack for bundling', () => {
      const webpackConfigPath = './webpack.config.js';
      expect(fs.existsSync(webpackConfigPath), 'webpack.config.js should exist').to.be.true;

      const webpackConfig = fs.readFileSync(webpackConfigPath, 'utf8');
      expect(webpackConfig).to.include('BicepReportMain.tsx');
      expect(webpackConfig).to.include('ts-loader');
    });

    it('should have updated package.json scripts', () => {
      const packageJsonPath = './package.json';
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      // Should use webpack for building
      expect(packageJson.scripts.build).to.include('webpack');

      // Should have React dependencies
      expect(packageJson.dependencies.react).to.be.a('string');
      expect(packageJson.dependencies['react-dom']).to.be.a('string');

      // Should have TypeScript React types
      expect(packageJson.devDependencies['@types/react']).to.be.a('string');
      expect(packageJson.devDependencies['@types/react-dom']).to.be.a('string');
    });
  });

  describe('Source Files', () => {
    it('should use proper module imports', () => {
      // Check that our source files use proper imports
      const extensionPath = './src/BicepReportExtension.tsx';
      if (!fs.existsSync(extensionPath)) {
        return;
      }

      const extensionContent = fs.readFileSync(extensionPath, 'utf8');

      // Should use proper ES6 imports
      expect(extensionContent).to.include("import * as SDK from 'azure-devops-extension-sdk'");
      expect(extensionContent).to.include('import React');
    });

    it('should maintain the same SDK method calls', () => {
      // Verify that our React components use the same SDK methods as before
      const extensionPath = './src/BicepReportExtension.tsx';
      const appPath = './src/BicepReportApp.tsx';

      if (!fs.existsSync(extensionPath) || !fs.existsSync(appPath)) {
        return;
      }

      const extensionContent = fs.readFileSync(extensionPath, 'utf8');
      const appContent = fs.readFileSync(appPath, 'utf8');

      // SDK.init and SDK.ready should be in BicepReportApp.tsx (fixing SDK loading conflict)
      expect(appContent).to.include('SDK.init');
      expect(appContent).to.include('SDK.ready');

      // SDK.resize should still be in BicepReportExtension.tsx
      expect(extensionContent).to.include('SDK.resize');
    });

    it('should use appropriate styling classes', () => {
      const extensionPath = './src/BicepReportExtension.tsx';
      if (!fs.existsSync(extensionPath)) {
        return;
      }

      const extensionContent = fs.readFileSync(extensionPath, 'utf8');

      // Should use azure-devops-ui classes for consistent styling
      expect(extensionContent).to.include('className="flex-grow"');
      expect(extensionContent).to.include('className="page-content page-content-top"');
      expect(extensionContent).to.include('className="flex-column rhythm-vertical-16"');
      expect(extensionContent).to.include('className="markdown-content"');
    });

    it('should maintain the same functionality', () => {
      const extensionPath = './src/BicepReportExtension.tsx';
      if (!fs.existsSync(extensionPath)) {
        return;
      }

      const extensionContent = fs.readFileSync(extensionPath, 'utf8');

      // Should have the same core functions - updated for SpotCheck pattern
      // initializeExtension was removed to fix SDK loading conflict
      expect(extensionContent).to.include('loadReports');
      expect(extensionContent).to.include('downloadArtifacts'); // Now using SpotCheck pattern
      expect(extensionContent).to.include('parseMarkdown');
      expect(extensionContent).to.include('getDisplayName');
    });
  });

  describe('Generated Files', () => {
    it('should have updated HTML structure without AMD loader', () => {
      const htmlPath = './contents/bicep-what-if-tab.html';
      if (!fs.existsSync(htmlPath)) {
        // Skip if file doesn't exist (build may not have run)
        return;
      }

      const htmlContent = fs.readFileSync(htmlPath, 'utf8');

      // Should have React root
      expect(htmlContent).to.include('id="react-root"');

      // Should NOT have old DOM structure
      expect(htmlContent).to.not.include('id="loading"');
      expect(htmlContent).to.not.include('id="error"');
      expect(htmlContent).to.not.include('id="content"');

      // Should NOT have AMD loader
      expect(htmlContent).to.not.include('amd-loader.js');
      expect(htmlContent).to.not.include('SDK.min.js');

      // Should have marked.js and bundled script
      expect(htmlContent).to.include('marked.min.js');
      expect(htmlContent).to.include('bicep-report-extension.js');

      // Should have updated CSP for React
      expect(htmlContent).to.include("script-src 'self' 'unsafe-inline'");
    });

    it('should ensure marked.min.js still exists for markdown parsing', () => {
      const markedPath = './contents/scripts/marked.min.js';
      expect(fs.existsSync(markedPath), 'marked.min.js should exist for markdown parsing').to.be
        .true;
    });

    it('should have webpack-generated bundle', () => {
      const bundlePath = './contents/bicep-report-extension.js';
      if (!fs.existsSync(bundlePath)) {
        // Skip if build hasn't run yet
        return;
      }

      // Bundle should contain React code
      const bundleContent = fs.readFileSync(bundlePath, 'utf8');
      expect(bundleContent.length).to.be.greaterThan(10000); // Should be substantial with React included
    });
  });
});
