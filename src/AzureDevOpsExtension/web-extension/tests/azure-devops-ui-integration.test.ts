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
  }
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

describe('Azure DevOps UI Integration Tests', () => {
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

  describe('Azure DevOps UI Components', () => {
    it('should import azure-devops-ui components', () => {
      const extensionPath = './src/BicepReportExtension.tsx';
      if (!fs.existsSync(extensionPath)) {
        return;
      }
      
      const extensionContent = fs.readFileSync(extensionPath, 'utf8');
      
      // Should import azure-devops-ui components
      expect(extensionContent).to.include("import { Header, TitleSize } from 'azure-devops-ui/Header'");
      expect(extensionContent).to.include("import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner'");
      expect(extensionContent).to.include("import { MessageBar, MessageBarSeverity } from 'azure-devops-ui/MessageBar'");
      expect(extensionContent).to.include("import { Card } from 'azure-devops-ui/Card'");
      expect(extensionContent).to.include("import { ZeroData } from 'azure-devops-ui/ZeroData'");
      
      // Should import azure-devops-ui CSS
      expect(extensionContent).to.include('import "azure-devops-ui/Core/override.css"');
    });

    it('should use Header component instead of custom header', () => {
      const extensionPath = './src/BicepReportExtension.tsx';
      if (!fs.existsSync(extensionPath)) {
        return;
      }
      
      const extensionContent = fs.readFileSync(extensionPath, 'utf8');
      
      // Should use Header component
      expect(extensionContent).to.include('<Header title="Bicep What-If Report" titleSize={TitleSize.Large} />');
      
      // Should NOT use old custom header
      expect(extensionContent).to.not.include('className="header"');
      expect(extensionContent).to.not.include('<h1>Bicep What-If Report</h1>');
    });

    it('should use Spinner component for loading state', () => {
      const extensionPath = './src/BicepReportExtension.tsx';
      if (!fs.existsSync(extensionPath)) {
        return;
      }
      
      const extensionContent = fs.readFileSync(extensionPath, 'utf8');
      
      // Should use Spinner component
      expect(extensionContent).to.include('<Spinner');
      expect(extensionContent).to.include('size={SpinnerSize.large}');
      expect(extensionContent).to.include('label="Loading Bicep What-If reports..."');
      
      // Should NOT use old loading div
      expect(extensionContent).to.not.include('className="loading"');
    });

    it('should use MessageBar component for error display', () => {
      const extensionPath = './src/BicepReportExtension.tsx';
      if (!fs.existsSync(extensionPath)) {
        return;
      }
      
      const extensionContent = fs.readFileSync(extensionPath, 'utf8');
      
      // Should use MessageBar component
      expect(extensionContent).to.include('<MessageBar');
      expect(extensionContent).to.include('severity={MessageBarSeverity.Error}');
      expect(extensionContent).to.include('messageClassName="font-family-monospace"');
      
      // Should NOT use old error div
      expect(extensionContent).to.not.include('className="error"');
    });

    it('should use ZeroData component for no reports state', () => {
      const extensionPath = './src/BicepReportExtension.tsx';
      if (!fs.existsSync(extensionPath)) {
        return;
      }
      
      const extensionContent = fs.readFileSync(extensionPath, 'utf8');
      
      // Should use ZeroData component
      expect(extensionContent).to.include('<ZeroData');
      expect(extensionContent).to.include('primaryText="No Bicep What-If reports found"');
      expect(extensionContent).to.include('secondaryText="No Bicep What-If reports found for this build."');
      
      // Should NOT use old no-reports div
      expect(extensionContent).to.not.include('className="no-reports"');
    });

    it('should use Card component for report display', () => {
      const extensionPath = './src/BicepReportExtension.tsx';
      if (!fs.existsSync(extensionPath)) {
        return;
      }
      
      const extensionContent = fs.readFileSync(extensionPath, 'utf8');
      
      // Should use Card component
      expect(extensionContent).to.include('<Card');
      expect(extensionContent).to.include('collapsible={true}');
      expect(extensionContent).to.include('titleProps={{');
      expect(extensionContent).to.include('contentProps={{');
      
      // Should NOT use old report item structure
      expect(extensionContent).to.not.include('className="report-list"');
      expect(extensionContent).to.not.include('className="report-item"');
      expect(extensionContent).to.not.include('<details>');
      expect(extensionContent).to.not.include('<summary>');
    });

    it('should use azure-devops-ui CSS classes', () => {
      const extensionPath = './src/BicepReportExtension.tsx';
      if (!fs.existsSync(extensionPath)) {
        return;
      }
      
      const extensionContent = fs.readFileSync(extensionPath, 'utf8');
      
      // Should use azure-devops-ui CSS classes
      expect(extensionContent).to.include('className="flex-grow"');
      expect(extensionContent).to.include('className="page-content page-content-top"');
      expect(extensionContent).to.include('className="flex-column rhythm-vertical-16"');
      expect(extensionContent).to.include('className="markdown-content"');
      
      // Should NOT use old custom container classes
      expect(extensionContent).to.not.include('className="container"');
    });
  });

  describe('Package Dependencies', () => {
    it('should have azure-devops-ui in package.json dependencies', () => {
      const packageJsonPath = './package.json';
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Should have azure-devops-ui dependency
      expect(packageJson.dependencies['azure-devops-ui']).to.be.a('string');
    });

    it('should have CSS loaders for webpack', () => {
      const packageJsonPath = './package.json';
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Should have CSS loaders
      expect(packageJson.devDependencies['style-loader']).to.be.a('string');
      expect(packageJson.devDependencies['css-loader']).to.be.a('string');
    });
  });

  describe('Build Configuration', () => {
    it('should have updated webpack config for CSS processing', () => {
      const webpackConfigPath = './webpack.config.js';
      expect(fs.existsSync(webpackConfigPath), 'webpack.config.js should exist').to.be.true;
      
      const webpackConfig = fs.readFileSync(webpackConfigPath, 'utf8');
      expect(webpackConfig).to.include('css-loader');
      expect(webpackConfig).to.include('style-loader');
    });

    it('should build successfully with azure-devops-ui', () => {
      const bundlePath = './contents/bicep-report-extension.js';
      if (!fs.existsSync(bundlePath)) {
        // Skip if build hasn't run yet
        return;
      }
      
      // Bundle should be larger now with azure-devops-ui included
      const bundleStats = fs.statSync(bundlePath);
      expect(bundleStats.size).to.be.greaterThan(500000); // Should be > 500KB with azure-devops-ui
    });
  });
});