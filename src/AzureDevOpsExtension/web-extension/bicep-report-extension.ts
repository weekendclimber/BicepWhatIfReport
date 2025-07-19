// Use the global SDK that's loaded via script tag
declare const SDK: any;

interface IBuildService {
  getBuildAttachments(projectId: string, buildId: number, type: string): Promise<any[]>;
  getAttachment(projectId: string, buildId: number, type: string, name: string): Promise<string>;
}

class BicepReportExtension {
  private buildService?: IBuildService;

  async initialize(): Promise<void> {
    try {
      // Modern SDK initialization
      await SDK.init({ loaded: false, applyTheme: true });

      // Get services
      this.buildService = await SDK.getService('ms.vss-build-web.build-service');

      // Load and display reports
      await this.loadReports();

      // Notify successful load
      await SDK.notifyLoadSucceeded();
    } catch (error) {
      console.error('Extension initialization failed:', error);

      // Provide more specific error message based on the error type
      let errorMessage = 'Failed to initialize the extension.';
      if (error instanceof Error) {
        if (error.message.includes('Required context not available')) {
          errorMessage = error.message;
        } else if (error.message.includes('SDK')) {
          errorMessage =
            'Failed to initialize Azure DevOps SDK. Please ensure this extension is running within Azure DevOps.';
        } else {
          errorMessage = `Extension error: ${error.message}`;
        }
      }

      this.showError(errorMessage);
      await SDK.notifyLoadFailed(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async loadReports(): Promise<void> {
    const webContext = SDK.getWebContext();
    const config = SDK.getConfiguration();

    // Enhanced context validation with detailed error messages
    const errors: string[] = [];

    if (!webContext) {
      errors.push('Azure DevOps web context is not available');
    } else {
      if (!webContext.project) {
        errors.push('Project context is missing from web context');
      }
    }

    if (!config) {
      errors.push('Extension configuration is not available');
    } else {
      if (!config.buildId) {
        errors.push('Build ID is missing from extension configuration');
      }
    }

    if (errors.length > 0) {
      const detailedError =
        `Required context not available. Missing: ${errors.join(', ')}. ` +
        `This extension must be used within an Azure DevOps build pipeline tab.`;
      throw new Error(detailedError);
    }

    const buildId = parseInt(config.buildId);
    const attachments = await this.buildService!.getBuildAttachments(
      webContext.project.id,
      buildId,
      'bicepwhatifreport'
    );

    const reports = attachments.filter(att => att.name.startsWith('md/'));

    if (reports.length === 0) {
      this.showNoReports();
      return;
    }

    await this.displayReports(reports, webContext.project.id, buildId);
  }

  private async displayReports(
    attachments: any[],
    projectId: string,
    buildId: number
  ): Promise<void> {
    const reportList = document.getElementById('report-list')!;

    const fetchPromises = attachments.map(async attachment => {
      try {
        const content = await this.buildService!.getAttachment(
          projectId,
          buildId,
          'bicepwhatifreport',
          attachment.name
        );

        const reportElement = this.createReportElement(attachment.name, content);
        reportList.appendChild(reportElement);
      } catch (error) {
        console.error('Error loading report:', attachment.name, error);
        const errorElement = this.createErrorElement(attachment.name, error);
        reportList.appendChild(errorElement);
      }
    });

    document.getElementById('loading')!.style.display = 'none';
    document.getElementById('content')!.style.display = 'block';

    // Auto-resize to fit content
    SDK.resize();
  }

  private createReportElement(name: string, content: string): HTMLElement {
    const li = document.createElement('li');
    li.className = 'report-item';

    const details = document.createElement('details');
    const summary = document.createElement('summary');

    const displayName = name.replace('md/', '').replace(/^[0-9]+/g, '');
    summary.textContent = displayName;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'markdown-content';

    // Use marked library if available
    if (typeof (window as any).marked !== 'undefined') {
      const parsedHtml = (window as any).marked.parse(content);
      contentDiv.innerHTML = this.sanitizeHtml(parsedHtml);
    } else {
      const pre = document.createElement('pre');
      pre.textContent = content;
      contentDiv.appendChild(pre);
    }

    details.appendChild(summary);
    details.appendChild(contentDiv);
    li.appendChild(details);

    return li;
  }

  private sanitizeHtml(html: string): string {
    // List of allowed HTML tags and attributes for markdown content
    const allowedTags = [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'br',
      'hr',
      'strong',
      'b',
      'em',
      'i',
      'u',
      's',
      'del',
      'ins',
      'ul',
      'ol',
      'li',
      'blockquote',
      'pre',
      'code',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'a',
      'img',
    ];

    const allowedAttributes: Record<string, string[]> = {
      a: ['href', 'title'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      th: ['align'],
      td: ['align'],
      table: ['align'],
    };

    // Dangerous URL protocols to block
    const dangerousProtocols = [
      'javascript:',
      'data:',
      'vbscript:',
      'file:',
      'about:',
      'chrome:',
      'chrome-extension:',
      'shell:',
      'ftp:',
      'jar:',
    ];

    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Recursively clean the elements
    this.cleanElement(tempDiv, allowedTags, allowedAttributes, dangerousProtocols);

    return tempDiv.innerHTML;
  }

  private cleanElement(
    element: Element,
    allowedTags: string[],
    allowedAttributes: Record<string, string[]>,
    dangerousProtocols: string[]
  ): void {
    const children = Array.from(element.children);

    for (const child of children) {
      const tagName = child.tagName.toLowerCase();

      if (!allowedTags.includes(tagName)) {
        // Remove disallowed tags but keep their text content
        const textNode = document.createTextNode(child.textContent || '');
        child.parentNode?.replaceChild(textNode, child);
        continue;
      }

      // Clean attributes
      const attributes = Array.from(child.attributes);
      const allowedAttrs = allowedAttributes[tagName] || [];

      for (const attr of attributes) {
        const attrName = attr.name.toLowerCase();

        // Remove any event handler attributes (onclick, onload, onerror, etc.)
        if (attrName.startsWith('on')) {
          child.removeAttribute(attr.name);
          continue;
        }

        // Remove any style attributes that could contain expressions
        if (attrName === 'style') {
          child.removeAttribute(attr.name);
          continue;
        }

        if (!allowedAttrs.includes(attrName)) {
          child.removeAttribute(attr.name);
        } else if (attrName === 'href' || attrName === 'src') {
          // Enhanced security check for URLs
          const value = attr.value.toLowerCase().trim();
          const isDangerous = dangerousProtocols.some(
            protocol =>
              value.startsWith(protocol) ||
              value.includes('\t' + protocol) ||
              value.includes('\n' + protocol) ||
              value.includes('\r' + protocol) ||
              value.includes(' ' + protocol)
          );

          if (isDangerous) {
            child.removeAttribute(attr.name);
          }
        }
      }

      // Recursively clean child elements
      this.cleanElement(child, allowedTags, allowedAttributes, dangerousProtocols);
    }
  }

  private createErrorElement(name: string, error: any): HTMLElement {
    const li = document.createElement('li');
    li.className = 'report-item';

    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = name + ' (Error)';
    summary.style.color = '#d13438';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'error';
    contentDiv.textContent = 'Error loading report: ' + (error?.message || error);

    details.appendChild(summary);
    details.appendChild(contentDiv);
    li.appendChild(details);

    return li;
  }

  private showNoReports(): void {
    document.getElementById('loading')!.style.display = 'none';
    document.getElementById('content')!.style.display = 'block';
    document.getElementById('no-reports')!.style.display = 'block';
    SDK.resize();
  }

  private showError(message: string): void {
    const errorDiv = document.getElementById('error')!;
    const loadingDiv = document.getElementById('loading')!;

    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    loadingDiv.style.display = 'none';
  }
}

// Initialize extension
document.addEventListener('DOMContentLoaded', () => {
  const extension = new BicepReportExtension();
  extension.initialize();
});
