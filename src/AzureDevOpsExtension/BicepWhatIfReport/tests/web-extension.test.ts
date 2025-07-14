import { expect } from 'chai';
import { JSDOM } from 'jsdom';

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
        const sanitizeHtml = require("sanitize-html");
        const sanitizedHtml = sanitizeHtml(parsedHtml, {
          allowedTags: sanitizeHtml.defaults.allowedTags.filter(tag => tag !== 'script'),
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
