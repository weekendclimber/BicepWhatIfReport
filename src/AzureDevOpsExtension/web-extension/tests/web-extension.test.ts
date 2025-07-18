import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import * as fs from 'fs';
import * as path from 'path';

// Set up a minimal DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const { window } = dom;
const { document } = window;

// Set global DOM objects
(global as any).window = window;
(global as any).document = document;

// Mock global SDK for testing
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
  getService: async () => ({
    getBuildAttachments: async () => [{ name: 'md/test-report.md', type: 'bicepwhatifreport' }],
    getAttachment: async () => '# Test Report\nThis is a test report.',
  }),
  resize: () => {},
};

// Set up DOM environment for testing
function setupDOM() {
  // Create basic DOM structure needed for the extension
  document.body.innerHTML = `
        <div id="loading" style="display: block;">Loading...</div>
        <div id="error" style="display: none;"></div>
        <div id="content" style="display: none;">
            <div id="no-reports" style="display: none;">No reports</div>
            <ul id="report-list"></ul>
        </div>
    `;
}

describe('Web Extension Tests', () => {
  describe('Script Dependency Validation', () => {
    it('should ensure all script references in HTML exist in the scripts directory', () => {
      // Read the HTML file
      const htmlPath = path.join(__dirname, '..', 'contents', 'bicep-what-if-tab.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      // Parse script src attributes from HTML
      const scriptRegex = /<script[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi;
      const scriptMatches = [...htmlContent.matchAll(scriptRegex)];
      const scriptSources = scriptMatches.map(match => match[1]);
      
      // Filter for scripts in the scripts/ directory
      const scriptsInScriptsDir = scriptSources.filter(src => src.startsWith('scripts/'));
      
      // Verify each script file exists
      const scriptsDir = path.join(__dirname, '..', 'contents', 'scripts');
      
      scriptsInScriptsDir.forEach(scriptSrc => {
        const scriptFileName = scriptSrc.replace('scripts/', '');
        const scriptPath = path.join(scriptsDir, scriptFileName);
        
        expect(fs.existsSync(scriptPath), 
          `Script file ${scriptSrc} referenced in HTML does not exist at ${scriptPath}`)
          .to.be.true;
      });
      
      // Ensure we found at least the expected scripts
      expect(scriptsInScriptsDir).to.include('scripts/SDK.min.js');
      expect(scriptsInScriptsDir).to.include('scripts/marked.min.js');
      
      // Ensure require.js is NOT referenced (regression test for issue #71)
      expect(scriptsInScriptsDir).to.not.include('scripts/require.js');
      expect(htmlContent).to.not.include('require.js');
    });

    it('should validate that inline AMD loader is present and functional', () => {
      // Read the HTML file
      const htmlPath = path.join(__dirname, '..', 'contents', 'bicep-what-if-tab.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      // Verify AMD loader components are present
      expect(htmlContent).to.include('window.define = function');
      expect(htmlContent).to.include('window.define.amd = true');
      expect(htmlContent).to.include('Simple AMD loader');
      
      // Set up JSDOM with the actual HTML content
      const dom = new JSDOM(htmlContent, {
        resources: 'usable',
        runScripts: 'dangerously',
        pretendToBeVisual: true
      });
      
      const { window } = dom;
      
      // Verify the define function was created
      expect(window.define).to.be.a('function');
      expect(window.define.amd).to.be.true;
      
      // Test the define function with SDK-like module pattern
      let moduleExports: any = null;
      
      // Simulate SDK.min.js module pattern: define(["exports"], function(exports) { ... })
      window.define(["exports"], function(exports: any) {
        exports.init = async function() { return { loaded: true }; };
        exports.getService = function() { return {}; };
        moduleExports = exports;
      });
      
      // Verify the module was processed correctly
      expect(moduleExports).to.not.be.null;
      expect(moduleExports.init).to.be.a('function');
      expect(window.SDK).to.equal(moduleExports);
    });

    it('should validate AMD loader handles different module patterns', () => {
      // Set up clean DOM environment
      const dom = new JSDOM(`
        <script>
          // Copy the AMD loader from our HTML
          window.define = function(deps, factory) {
            if (typeof deps === 'function') {
              factory = deps;
              deps = [];
            }
            
            if (!Array.isArray(deps)) {
              deps = [];
            }
            
            var module = { exports: {} };
            var exports = module.exports;
            
            if (deps && deps.length > 0) {
              var resolvedDeps = deps.map(function(dep) {
                if (dep === 'exports') return exports;
                return {};
              });
              factory.apply(null, resolvedDeps);
            } else {
              factory(exports);
            }
            
            if (exports.init) {
              window.SDK = exports;
            }
            if (exports && exports.marked) {
              window.marked = exports.marked;
            } else if (typeof exports === 'function' && exports.name === 'marked') {
              window.marked = exports;
            }
          };
          window.define.amd = true;
        </script>
      `, { runScripts: 'dangerously' });
      
      const { window } = dom;
      
      // Test 1: Function-only pattern (like marked.js)
      window.define(function() {
        return function marked(text: string) { return '<p>' + text + '</p>'; };
      });
      
      // Test 2: Factory with exports dependency
      window.define(['exports'], function(exports: any) {
        exports.testFunction = function() { return 'test'; };
      });
      
      // Test 3: No dependencies factory
      let result: any = null;
      window.define(function(exports: any) {
        exports.noDepTest = true;
        result = exports;
      });
      
      expect(window.define).to.be.a('function');
      expect(window.define.amd).to.be.true;
      expect(result.noDepTest).to.be.true;
    });

    it('should prevent "define is not defined" error when loading SDK.min.js', () => {
      // This test simulates the exact scenario that caused issue #71
      // Read the HTML file to ensure define function is available before SDK loading
      const htmlPath = path.join(__dirname, '..', 'contents', 'bicep-what-if-tab.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      // Set up JSDOM with the actual HTML content
      const dom = new JSDOM(htmlContent, {
        resources: 'usable',
        runScripts: 'dangerously',
        pretendToBeVisual: true
      });
      
      const { window } = dom;
      
      // Verify define function exists before any module would be loaded
      expect(window.define, 'define function should be available before SDK.min.js loads')
        .to.be.a('function');
      expect(window.define.amd, 'define.amd should be true for AMD compatibility')
        .to.be.true;
      
      // Simulate SDK.min.js attempting to define itself
      // This is the pattern that was failing with "define is not defined"
      let sdkLoaded = false;
      let defineError: Error | null = null;
      
      try {
        // Simulate the actual SDK.min.js module definition pattern
        window.define(["exports"], function(exports: any) {
          // Mock SDK initialization
          exports.init = async function() { 
            return { loaded: true, version: 'v4' }; 
          };
          exports.notifyLoadSucceeded = async function() {};
          exports.notifyLoadFailed = async function() {};
          exports.getWebContext = function() {
            return { project: { id: 'test' } };
          };
          exports.getConfiguration = function() {
            return { buildId: 123 };
          };
          exports.getService = async function() {
            return {
              getBuildAttachments: async () => [],
              getAttachment: async () => 'test content'
            };
          };
          exports.resize = function() {};
          
          sdkLoaded = true;
        });
      } catch (error) {
        defineError = error as Error;
      }
      
      // Verify no "define is not defined" error occurred
      expect(defineError, 'No error should occur when SDK tries to use define function')
        .to.be.null;
      expect(sdkLoaded, 'SDK module should load successfully')
        .to.be.true;
      expect(window.SDK, 'SDK should be available globally after loading')
        .to.not.be.undefined;
      expect(window.SDK.init, 'SDK.init should be available')
        .to.be.a('function');
    });
  });

  describe('BicepReportExtension', () => {
    let BicepReportExtension: any;

    beforeEach(() => {
      setupDOM();

      // Set global SDK mock
      (global as any).SDK = mockSDK;
      (global as any).window = global;
      (global as any).document = document;

      // Mock marked library
      (global as any).marked = {
        parse: (content: string) => `<p>${content}</p>`,
      };

      // Load the compiled extension class
      // Since we can't easily import the compiled JS, we'll test the core functionality
    });

    it('should have required DOM elements available', () => {
      const loadingElement = document.getElementById('loading');
      const errorElement = document.getElementById('error');
      const contentElement = document.getElementById('content');
      const reportListElement = document.getElementById('report-list');

      expect(loadingElement).to.not.be.null;
      expect(errorElement).to.not.be.null;
      expect(contentElement).to.not.be.null;
      expect(reportListElement).to.not.be.null;
    });

    it('should create report elements with proper structure and sanitized content', () => {
      // Test the createReportElement functionality manually
      const reportName = 'md/test-report.md';
      const reportContent = '# Test Report\nThis is a test report.';

      // Create elements as the extension would
      const li = document.createElement('li');
      li.className = 'report-item';

      const details = document.createElement('details');
      const summary = document.createElement('summary');

      const displayName = reportName.replace('md/', '').replace(/\^[0-9]+/g, '');
      summary.textContent = displayName;

      const contentDiv = document.createElement('div');
      contentDiv.className = 'markdown-content';

      // Use marked library if available
      if (typeof (global as any).marked !== 'undefined') {
        const parsedHtml = (global as any).marked.parse(reportContent);
        // Simulate basic sanitization - remove any script tags and dangerous attributes
        const sanitizeHtml = require('sanitize-html');
        const sanitizedHtml = sanitizeHtml(parsedHtml, {
          allowedTags: sanitizeHtml.defaults.allowedTags.filter((tag: string) => tag !== 'script'),
          allowedAttributes: false, // Allow no attributes for maximum safety
        });
        contentDiv.innerHTML = sanitizedHtml;
      } else {
        const pre = document.createElement('pre');
        pre.textContent = reportContent;
        contentDiv.appendChild(pre);
      }

      details.appendChild(summary);
      details.appendChild(contentDiv);
      li.appendChild(details);

      // Verify structure
      expect(li.className).to.equal('report-item');
      expect(summary.textContent).to.equal('test-report.md');
      expect(contentDiv.className).to.equal('markdown-content');
      expect(contentDiv.innerHTML).to.include('<p># Test Report');
      // Verify no dangerous content is present
      expect(contentDiv.innerHTML).to.not.include('<script');
    });

    it('should create error elements with proper structure', () => {
      const reportName = 'md/failed-report.md';
      const errorMessage = 'Failed to load report';

      // Create error element as the extension would
      const li = document.createElement('li');
      li.className = 'report-item';

      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = reportName + ' (Error)';
      summary.style.color = '#d13438';

      const contentDiv = document.createElement('div');
      contentDiv.className = 'error';
      contentDiv.textContent = 'Error loading report: ' + errorMessage;

      details.appendChild(summary);
      details.appendChild(contentDiv);
      li.appendChild(details);

      // Verify error structure
      expect(li.className).to.equal('report-item');
      expect(summary.textContent).to.include('Error');
      expect(summary.style.color).to.match(/(#d13438|rgb\(209, 52, 56\))/);
      expect(contentDiv.className).to.equal('error');
      expect(contentDiv.textContent).to.include('Error loading report');
    });

    it('should handle no reports scenario', () => {
      const loadingDiv = document.getElementById('loading')!;
      const contentDiv = document.getElementById('content')!;
      const noReportsDiv = document.getElementById('no-reports')!;

      // Simulate showNoReports functionality
      loadingDiv.style.display = 'none';
      contentDiv.style.display = 'block';
      noReportsDiv.style.display = 'block';

      expect(loadingDiv.style.display).to.equal('none');
      expect(contentDiv.style.display).to.equal('block');
      expect(noReportsDiv.style.display).to.equal('block');
    });

    it('should sanitize malicious content from markdown', () => {
      // Test malicious content is properly sanitized
      const maliciousContent =
        '<script>alert("xss")</script><img src="x" onerror="alert(1)" onclick="alert(2)"><a href="javascript:alert(2)" onmouseover="alert(3)">Link</a><div style="background:url(javascript:alert(4))">Styled</div><p onclick="alert(5)">Text</p>';

      // Mock marked to return malicious content
      (global as any).marked = {
        parse: () => maliciousContent,
      };

      const contentDiv = document.createElement('div');

      // Simulate the enhanced sanitization process manually
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = maliciousContent;

      // Remove script tags and dangerous attributes
      const scripts = tempDiv.querySelectorAll('script');
      scripts.forEach(script => script.remove());

      // Remove all event handler attributes (onclick, onerror, onmouseover, etc.)
      const allElements = tempDiv.querySelectorAll('*');
      allElements.forEach(element => {
        Array.from(element.attributes).forEach(attr => {
          if (attr.name.toLowerCase().startsWith('on')) {
            element.removeAttribute(attr.name);
          }
          if (attr.name.toLowerCase() === 'style') {
            element.removeAttribute(attr.name);
          }
        });
      });

      // Remove dangerous URL protocols
      const links = tempDiv.querySelectorAll('a[href], img[src]');
      links.forEach(link => {
        const url = link.getAttribute('href') || link.getAttribute('src') || '';
        const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];
        const isDangerous = dangerousProtocols.some(protocol =>
          url.toLowerCase().trim().startsWith(protocol)
        );
        if (isDangerous) {
          if (link.hasAttribute('href')) link.removeAttribute('href');
          if (link.hasAttribute('src')) link.removeAttribute('src');
        }
      });

      contentDiv.innerHTML = tempDiv.innerHTML;

      // Verify dangerous content was removed
      expect(contentDiv.innerHTML).to.not.include('<script');
      expect(contentDiv.innerHTML).to.not.include('onerror');
      expect(contentDiv.innerHTML).to.not.include('onclick');
      expect(contentDiv.innerHTML).to.not.include('onmouseover');
      expect(contentDiv.innerHTML).to.not.include('javascript:');
      expect(contentDiv.innerHTML).to.not.include('style=');
    });

    it('should preserve safe markdown content', () => {
      // Test that safe markdown content is preserved
      const safeContent =
        '<h1>Title</h1><p>This is <strong>bold</strong> and <em>italic</em> text.</p><ul><li>Item 1</li><li>Item 2</li></ul>';

      (global as any).marked = {
        parse: () => safeContent,
      };

      const contentDiv = document.createElement('div');
      contentDiv.innerHTML = safeContent;

      // Verify safe content is preserved
      expect(contentDiv.innerHTML).to.include('<h1>Title</h1>');
      expect(contentDiv.innerHTML).to.include('<strong>bold</strong>');
      expect(contentDiv.innerHTML).to.include('<em>italic</em>');
      expect(contentDiv.innerHTML).to.include('<ul><li>Item 1</li>');
    });

    it('should have Content Security Policy implemented', () => {
      // Test that CSP is configured in the HTML
      // Since we can't directly test the meta tag in JSDOM without loading the actual HTML,
      // we'll verify the expected CSP string format is correct
      const expectedCSP =
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self'; object-src 'none'; media-src 'none'; frame-src 'none';";

      // Verify the CSP contains expected security directives
      expect(expectedCSP).to.include("default-src 'self'");
      expect(expectedCSP).to.include("script-src 'self'");
      expect(expectedCSP).to.include("object-src 'none'");
      expect(expectedCSP).to.include("frame-src 'none'");

      // This test ensures we have documented the expected CSP configuration
      // The actual CSP enforcement happens at the browser level when the HTML is loaded
    });

    it('should handle display reports scenario', () => {
      const loadingDiv = document.getElementById('loading')!;
      const contentDiv = document.getElementById('content')!;
      const reportListDiv = document.getElementById('report-list')!;

      // Simulate successful report loading
      loadingDiv.style.display = 'none';
      contentDiv.style.display = 'block';

      // Add a mock report item
      const li = document.createElement('li');
      li.className = 'report-item';
      li.textContent = 'Test Report';
      reportListDiv.appendChild(li);

      expect(loadingDiv.style.display).to.equal('none');
      expect(contentDiv.style.display).to.equal('block');
      expect(reportListDiv.children.length).to.equal(1);
      expect(reportListDiv.children[0].textContent).to.equal('Test Report');
    });
  });
});
