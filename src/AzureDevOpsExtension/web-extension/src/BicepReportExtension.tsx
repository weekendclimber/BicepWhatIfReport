import React, { useState, useEffect } from 'react';
import * as SDK from 'azure-devops-extension-sdk';
import { IBuildService, BuildAttachment, ReportItem, IExtendedPageContext, IPageDataService } from './types';

const BicepReportExtension: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [noReports, setNoReports] = useState(false);

  useEffect(() => {
    initializeExtension();
  }, []);

  const initializeExtension = async (): Promise<void> => {
    try {
      // Modern SDK initialization
      await SDK.init({ loaded: false, applyTheme: true });

      // Load and display reports
      await loadReports();

      // Notify successful load
      await SDK.notifyLoadSucceeded();
    } catch (error) {
      // Handle missing Build ID context gracefully - this is an expected scenario
      // when the extension is accessed outside of a build pipeline context
      if (error instanceof Error && error.message.includes('Required context not available')) {
        setError(error.message);
        // Still notify successful load since the extension loaded correctly,
        // it just can't display reports due to missing context
        await SDK.notifyLoadSucceeded();
        return;
      }

      // Log unexpected errors to console for debugging
      console.error('Extension initialization failed:', error);

      // Handle other initialization errors that indicate real failures
      let errorMessage = 'Failed to initialize the extension.';
      if (error instanceof Error) {
        if (error.message.includes('SDK')) {
          errorMessage =
            'Failed to initialize Azure DevOps SDK. Please ensure this extension is running within Azure DevOps.';
        } else {
          errorMessage = `Extension error: ${error.message}`;
        }
      }

      setError(errorMessage);
      await SDK.notifyLoadFailed(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async (): Promise<void> => {
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

    // Try multiple approaches to get the Build ID
    let buildId: number | null = null;
    let buildIdSource = '';

    // Method 1: From page context navigation (primary method for build summary pages)
    try {
      const pageContext = SDK.getPageContext() as IExtendedPageContext;
      if (pageContext && pageContext.navigation && pageContext.navigation.currentBuild) {
        buildId = pageContext.navigation.currentBuild.id;
        buildIdSource = 'page context navigation';
      }
    } catch (error) {
      console.log('Failed to get build ID from page context navigation:', error);
    }

    // Method 2: From configuration (standard approach)
    if (!buildId && config && config.buildId) {
      buildId = parseInt(config.buildId);
      buildIdSource = 'configuration';
    }

    // Method 3: From URL parameters (fallback for build result tabs)
    if (!buildId) {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const buildIdFromUrl = urlParams.get('buildId');
        if (buildIdFromUrl) {
          buildId = parseInt(buildIdFromUrl);
          buildIdSource = 'URL parameters';
        }
      } catch (error) {
        console.log('Failed to extract build ID from URL:', error);
      }
    }

    // Method 4: From host page data service (advanced approach)
    if (!buildId) {
      try {
        const PAGE_DATA_SERVICE = 'ms.vss-tfs-web.tfs-page-data-service';
        const hostPageDataService = (await SDK.getService(PAGE_DATA_SERVICE)) as IPageDataService;
        if (hostPageDataService) {
          const pageData = await hostPageDataService.getPageData();
          if (pageData && pageData.buildId) {
            buildId = parseInt(pageData.buildId);
            buildIdSource = 'host page data service';
          }
        }
      } catch (error) {
        console.log('Failed to get build ID from host page data service:', error);
      }
    }

    if (!buildId) {
      errors.push(
        'Build ID is not available from any source (configuration, URL, or page context)'
      );
    }

    if (errors.length > 0) {
      const detailedError =
        `Required context not available. Missing: ${errors.join(', ')}. ` +
        `This extension must be used within an Azure DevOps build pipeline tab. ` +
        `Debug info: Current URL: ${window.location.href}, ` +
        `Configuration: ${JSON.stringify(config)}, ` +
        `Web context project: ${webContext?.project?.id || 'undefined'}`;
      throw new Error(detailedError);
    }

    console.log(`Build ID obtained from ${buildIdSource}: ${buildId}`);
    
    const WEB_BUILD_SERVICE = 'ms.vss-build-web.build-service';
    const buildService = (await SDK.getService(WEB_BUILD_SERVICE)) as IBuildService;
    const attachments = await buildService.getBuildAttachments(
      webContext.project.id,
      buildId!,
      'bicepwhatifreport'
    );

    const reportAttachments = attachments.filter(att => att.name.startsWith('md/'));

    if (reportAttachments.length === 0) {
      setNoReports(true);
      return;
    }

    await displayReports(reportAttachments, webContext.project.id, buildId!, buildService);
  };

  const displayReports = async (
    attachments: BuildAttachment[],
    projectId: string,
    buildId: number,
    buildService: IBuildService
  ): Promise<void> => {
    const reportPromises = attachments.map(async attachment => {
      try {
        const content = await buildService.getAttachment(
          projectId,
          buildId,
          'bicepwhatifreport',
          attachment.name
        );

        return {
          name: attachment.name,
          content: content,
        };
      } catch (error) {
        console.error('Error loading report:', attachment.name, error);
        return {
          name: attachment.name,
          content: '',
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });

    const loadedReports = await Promise.all(reportPromises);
    setReports(loadedReports);

    // Auto-resize to fit content
    SDK.resize();
  };

  const sanitizeHtml = (html: string): string => {
    // List of allowed HTML tags and attributes for markdown content
    const allowedTags = [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
      'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'a', 'img',
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
      'javascript:', 'data:', 'vbscript:', 'file:', 'about:',
      'chrome:', 'chrome-extension:', 'shell:', 'ftp:', 'jar:',
    ];

    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Recursively clean the elements
    const cleanElement = (element: Element): void => {
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
        cleanElement(child);
      }
    };

    cleanElement(tempDiv);
    return tempDiv.innerHTML;
  };

  const parseMarkdown = (content: string): string => {
    // Check if marked library is available
    if (typeof (window as any).marked !== 'undefined') {
      const parsedHtml = (window as any).marked.parse(content);
      return sanitizeHtml(parsedHtml);
    } else {
      // Fallback to plain text
      return content;
    }
  };

  const getDisplayName = (name: string): string => {
    return name.replace('md/', '').replace(/^[0-9]+/g, '');
  };

  useEffect(() => {
    // Auto-resize when content changes
    SDK.resize();
  }, [reports, error, noReports]);

  if (loading) {
    return (
      <div className="container">
        <div className="header">
          <h1>Bicep What-If Report</h1>
        </div>
        <div className="loading">Loading Bicep What-If reports...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="header">
          <h1>Bicep What-If Report</h1>
        </div>
        <div className="error">{error}</div>
      </div>
    );
  }

  if (noReports) {
    return (
      <div className="container">
        <div className="header">
          <h1>Bicep What-If Report</h1>
        </div>
        <div className="report-content">
          <div className="no-reports">
            No Bicep What-If reports found for this build.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Bicep What-If Report</h1>
      </div>
      <div className="report-content">
        <ul className="report-list">
          {reports.map((report, index) => (
            <li key={index} className="report-item">
              {report.error ? (
                <details>
                  <summary style={{ color: '#d13438' }}>
                    {getDisplayName(report.name)} (Error)
                  </summary>
                  <div className="error">
                    Error loading report: {report.error}
                  </div>
                </details>
              ) : (
                <details>
                  <summary>{getDisplayName(report.name)}</summary>
                  <div 
                    className="markdown-content"
                    dangerouslySetInnerHTML={{ 
                      __html: parseMarkdown(report.content) 
                    }}
                  />
                </details>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default BicepReportExtension;