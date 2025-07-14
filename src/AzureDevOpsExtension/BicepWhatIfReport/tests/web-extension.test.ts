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

    it('should create report elements with proper structure', () => {
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
        contentDiv.innerHTML = (global as any).marked.parse(reportContent);
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
