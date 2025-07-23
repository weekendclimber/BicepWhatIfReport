import React, { useState, useEffect } from 'react';
import * as SDK from 'azure-devops-extension-sdk';
import {
  IBuildPageDataService,
  BuildServiceIds,
  //IBuildPageData,
} from 'azure-devops-extension-api/Build';
import { BuildRestClient } from 'azure-devops-extension-api/Build';
import { getClient } from 'azure-devops-extension-api';
import * as Build from 'azure-devops-extension-api/Build/Build';
import {
  ReportItem,
  //IExtendedPageContext,
  //IPageDataService,
} from './types';

// Azure DevOps UI Components
import { Header, TitleSize } from 'azure-devops-ui/Header';
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner';
import { MessageBar, MessageBarSeverity } from 'azure-devops-ui/MessageBar';
import { Card } from 'azure-devops-ui/Card';
import { ZeroData } from 'azure-devops-ui/ZeroData';

// Azure DevOps UI Core and utilities
//import 'azure-devops-ui/Core/override.css';
import 'azure-devops-ui/Core/_platformCommon.scss';

// Constants for service names
//const PAGE_DATA_SERVICE = 'ms.vss-tfs-web.tfs-page-data-service';

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
      // Modern SDK initialization with double-loading protection
      console.log('Initializing Bicep What-If Report Extension...');

      // Check if SDK is already initialized to prevent double loading
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(window as any).VSS_SDK_INITIALIZED) {
        await SDK.init({ loaded: false, applyTheme: true });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).VSS_SDK_INITIALIZED = true;
        console.log('Azure DevOps SDK initialized successfully.');
      } else {
        console.log('Azure DevOps SDK already initialized, skipping initialization.');
      }

      // Load and display reports
      console.log('Loading Bicep What-If reports...');
      await loadReports();
      console.log('Bicep What-If reports loaded successfully.');

      // Notify successful load
      console.log('Notifying Azure DevOps SDK of successful load.');
      await SDK.notifyLoadSucceeded();
      console.log('Azure DevOps SDK notified of successful load.');
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
      console.log('Azure DevOps web context is not available');
      errors.push('Azure DevOps web context is not available');
    } else if (!webContext.project) {
      console.log('Project context is missing from web context');
      errors.push('Project context is missing from web context');
    } else {
      console.log(`Web context project ID: ${webContext.project.id}`);
    }

    // Try multiple approaches to get the Build ID
    let buildId: number | undefined;
    let buildIdSource = '';

    // Method 1: From BuildPageDataService (primary method for build summary pages)
    try {
      console.log('Attempting to get Build ID from BuildPageDataService...');
      const buildPageService: IBuildPageDataService = await SDK.getService(
        BuildServiceIds.BuildPageDataService
      );
      console.log('BuildPageDataService obtained successfully.');

      // Use the BuildPageDataService to get build data
      console.log('Fetching build page data...');
      const buildPageData = await buildPageService.getBuildPageData();
      if (buildPageData) {
        if (buildPageData.build) {
          buildId = buildPageData.build.id;
          buildIdSource = 'build page data service';
          console.log('Build ID obtained from BuildPageDataService:', buildPageData.build.id);
        } else {
          // Send a log with all the build page data written out to the console
          console.log('Build ID is not available in BuildPageDataService.');
          console.log(`Build Page Data:\n${JSON.stringify(buildPageData, null, 2)}`);
          errors.push('Build ID is not available in BuildPageDataService.');
        }
      } else {
        console.log('Build page data is not available.');
        errors.push('Build page data is not available.');
      }
    } catch (error) {
      console.log('Failed to get build page data service:', error);
      errors.push('Failed to get build page data service.');
    }

    if (buildId === undefined) {
      errors.push(
        'Build ID is not available from any source (configuration, URL, or page context)'
      );
    }

    if (errors.length > 0) {
      const detailedError =
        `Required context not available. Missing:\n\t${errors.join('\n\t')}\n` +
        `This extension must be used within an Azure DevOps build pipeline tab.\n` +
        `Debug info: Current URL: ${window.location.href}\n` +
        `Configuration: ${JSON.stringify(config)}\n` +
        `Web context project: ${webContext?.project?.id || 'undefined'}`;
      throw new Error(detailedError);
    } else {
      console.log(`Build ID obtained from ${buildIdSource}: ${buildId}`);
    }

    if (buildId !== undefined) {
      try {
        // Use the proper Azure DevOps Extension API client instead of SDK.getService()
        console.log('Getting BuildRestClient...');
        const buildClient = getClient(BuildRestClient);
        console.log('BuildRestClient obtained successfully.');

        // The BuildRestClient is always available when properly initialized
        if (!buildClient) {
          throw new Error(
            `Build client could not be initialized. ` +
              `This may occur when:\n` +
              `- The extension is not running in a proper Azure DevOps context\n` +
              `- The required permissions are missing\n` +
              `- The Azure DevOps SDK version is incompatible\n` +
              `Please ensure this extension is accessed from a build pipeline results page.`
          );
        } else {
          console.log('BuildRestClient is available.');
        }

        // Get build attachments for Bicep What-If reports (matches how pipeline task uploads them)
        console.log(
          `Fetching attachments for build ID '${buildId}' and project '${webContext.project.id}' with type 'bicepwhatifreport'...`
        );

        // Add detailed parameter logging for troubleshooting
        console.log('Parameters for getAttachments call:');
        console.log(
          `  - projectId: "${webContext.project.id}" (type: ${typeof webContext.project.id})`
        );
        console.log(`  - buildId: ${buildId} (type: ${typeof buildId})`);
        console.log(`  - type: "bicepwhatifreport" (case-sensitive)`);

        // Use the attachment-based approach that matches the pipeline task upload method
        // Wrap in timeout to prevent indefinite hanging
        let attachments: Build.Attachment[];
        try {
          const timeoutMs = 30000; // 30 second timeout
          console.log(`Setting ${timeoutMs}ms timeout for getAttachments call...`);

          attachments = await Promise.race([
            buildClient.getAttachments(webContext.project.id, buildId, 'bicepwhatifreport'),
            new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error(`getAttachments call timed out after ${timeoutMs}ms`)),
                timeoutMs
              )
            ),
          ]);

          console.log(`getAttachments call completed successfully.`);
        } catch (timeoutError) {
          console.error('getAttachments call failed:', timeoutError);

          // Try a diagnostic call with a standard attachment type to test API connectivity
          console.log('Attempting diagnostic call with standard attachment type "logs"...');
          try {
            const diagnosticAttachments = await Promise.race([
              buildClient.getAttachments(webContext.project.id, buildId, 'logs'),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Diagnostic call timed out')), 10000)
              ),
            ]);
            console.log(
              `Diagnostic call successful: found ${diagnosticAttachments.length} log attachments`
            );

            // If diagnostic call works, the issue is specific to 'bicepwhatifreport' type
            throw new Error(
              `Failed to retrieve 'bicepwhatifreport' attachments (call timed out after 30s), ` +
                `but API connectivity is working (diagnostic call found ${diagnosticAttachments.length} log attachments). ` +
                `This suggests:\n` +
                `1. No attachments of type 'bicepwhatifreport' exist for this build\n` +
                `2. The attachment type name may be case-sensitive or misspelled\n` +
                `3. The pipeline task may not have uploaded attachments correctly\n` +
                `Please verify the pipeline task uploaded attachments with exact type 'bicepwhatifreport'.`
            );
          } catch (diagnosticError) {
            // Both calls failed - likely an API/permission issue
            throw new Error(
              `Both main and diagnostic API calls failed. This indicates an API connectivity or permissions issue:\n` +
                `- Main error: ${timeoutError instanceof Error ? timeoutError.message : String(timeoutError)}\n` +
                `- Diagnostic error: ${diagnosticError instanceof Error ? diagnosticError.message : String(diagnosticError)}\n` +
                `Please check:\n` +
                `1. Extension permissions for Build API access\n` +
                `2. Network connectivity to Azure DevOps APIs\n` +
                `3. Build ID ${buildId} exists and is accessible in project ${webContext.project.id}`
            );
          }
        }

        console.log(`Found ${attachments.length} attachments for build ${buildId}`);

        // Filter for markdown report attachments (pipeline task prefixes with 'md/')
        const reportAttachments = attachments.filter(att => att.name.startsWith('md/'));

        if (reportAttachments.length === 0) {
          console.log('No Bicep What-If report attachments found.');
          setNoReports(true);
          return;
        }

        console.log(
          `Found ${reportAttachments.length} Bicep What-If report attachments:`,
          reportAttachments.map(a => a.name)
        );

        // Display the reports from the attachments
        await displayReports(reportAttachments, webContext.project.id, buildId, buildClient);
      } catch (error) {
        throw new Error(
          `Failed to load Bicep What-If reports: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  };

  const displayReports = async (
    attachments: Build.Attachment[],
    projectId: string,
    buildId: number,
    buildClient: BuildRestClient
  ): Promise<void> => {
    // Since BuildRestClient.getAttachment requires timelineId and recordId,
    // we need to get the timeline first to find the record IDs for our attachments
    let timeline: Build.Timeline | null = null;
    try {
      timeline = await buildClient.getBuildTimeline(projectId, buildId);
    } catch (error) {
      console.error('Failed to get build timeline:', error);
      setError('Failed to get build timeline information needed to retrieve attachment content.');
      return;
    }

    if (!timeline || !timeline.records) {
      setError('Build timeline is not available or contains no records.');
      return;
    }

    const reportPromises = attachments.map(async attachment => {
      try {
        // Find a timeline record that might contain this attachment
        // This is a heuristic approach since we don't have exact timeline/record mapping
        for (const record of timeline.records) {
          try {
            const contentBuffer = await buildClient.getAttachment(
              projectId,
              buildId,
              timeline.id,
              record.id,
              'bicepwhatifreport',
              attachment.name
            );

            // Convert ArrayBuffer to string
            const content = new TextDecoder().decode(contentBuffer);
            return {
              name: attachment.name,
              content: content,
            };
          } catch (recordError: unknown) {
            // This record doesn't have the attachment, try the next one
            console.log(
              `Attachment ${attachment.name} not found in record ${record.id}, trying next record: ${String(recordError)}`
            );
            continue;
          }
        }

        // If we reach here, no record had the attachment
        throw new Error(`Attachment ${attachment.name} not found in any timeline record`);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (window as any).marked !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      <div className="flex-grow">
        <Header title="Bicep What-If Report" titleSize={TitleSize.Large} />
        <div className="page-content page-content-top">
          <Spinner
            size={SpinnerSize.large}
            label="Loading Bicep What-If reports..."
            ariaLabel="Loading Bicep What-If reports"
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow">
        <Header title="Bicep What-If Report" titleSize={TitleSize.Large} />
        <div className="page-content page-content-top">
          <MessageBar severity={MessageBarSeverity.Error} messageClassName="font-family-monospace">
            {error}
          </MessageBar>
        </div>
      </div>
    );
  }

  if (noReports) {
    return (
      <div className="flex-grow">
        <Header title="Bicep What-If Report" titleSize={TitleSize.Large} />
        <div className="page-content page-content-top">
          <ZeroData
            primaryText="No Bicep What-If reports found"
            secondaryText="No Bicep What-If reports found for this build."
            imageAltText="No reports found"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow">
      <Header title="Bicep What-If Report" titleSize={TitleSize.Large} />
      <div className="page-content page-content-top">
        <div className="flex-column rhythm-vertical-16">
          {reports.map((report, index) => (
            <Card
              key={index}
              collapsible={true}
              collapsed={false}
              titleProps={{
                text: getDisplayName(report.name),
                size: TitleSize.Medium,
              }}
              contentProps={{
                contentPadding: true,
              }}
            >
              {report.error ? (
                <MessageBar
                  severity={MessageBarSeverity.Error}
                  messageClassName="font-family-monospace"
                >
                  Error loading report: {report.error}
                </MessageBar>
              ) : (
                <div
                  className="markdown-content"
                  dangerouslySetInnerHTML={{
                    __html: parseMarkdown(report.content),
                  }}
                />
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BicepReportExtension;
