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

// Constants for service names and configuration
//const PAGE_DATA_SERVICE = 'ms.vss-tfs-web.tfs-page-data-service';
const ATTACHMENT_TYPE = 'bicepwhatifreport';
const MAX_WAIT_MS = 45000; // 45 seconds maximum wait time
const BACKOFF_DELAYS = [1000, 2000, 3000, 5000, 8000, 13000]; // Progressive backoff in ms

// Utility functions
const isDebugMode = (): boolean => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('debug') === '1' || window.location.hostname === 'localhost';
};

const debugLog = (message: string, ...args: unknown[]): void => {
  if (isDebugMode()) {
    console.log(`[BicepWhatIfTab] ${message}`, ...args);
  }
};

const infoLog = (message: string, ...args: unknown[]): void => {
  console.log(`[BicepWhatIfTab] ${message}`, ...args);
};

interface ParsedAttachmentIds {
  timelineId: string;
  recordId: string;
}

/**
 * Parse attachment self link to extract timelineId and recordId
 * Expected pattern: .../_apis/build/builds/{buildId}/timeline/{timelineId}/records/{recordId}/attachments/{type}/{name}
 */
const parseAttachmentLink = (selfHref: string): ParsedAttachmentIds | null => {
  const timelineRecordPattern = /\/timeline\/([^/]+)\/records\/([^/]+)\/attachments\//;
  const match = selfHref.match(timelineRecordPattern);
  
  if (match && match[1] && match[2]) {
    return {
      timelineId: match[1],
      recordId: match[2]
    };
  }
  
  debugLog('Failed to parse attachment link', { selfHref, match });
  return null;
};

/**
 * Orchestrator function to fetch reports with retry logic and progressive backoff
 */
const fetchReportsWithRetry = async (
  buildClient: BuildRestClient,
  projectId: string,
  buildId: number
): Promise<Build.Attachment[]> => {
  const startTime = Date.now();
  let attempt = 0;
  let lastError: Error | null = null;
  
  while (Date.now() - startTime < MAX_WAIT_MS) {
    try {
      debugLog(`Attempt ${attempt + 1}: Fetching attachments...`);
      
      const attachments = await buildClient.getAttachments(projectId, buildId, ATTACHMENT_TYPE);
      const reportAttachments = attachments.filter(att => att.name.startsWith('md/'));
      
      if (reportAttachments.length > 0) {
        const elapsed = Date.now() - startTime;
        infoLog(`Found ${reportAttachments.length} report attachments after ${elapsed}ms (${attempt + 1} attempts)`);
        return reportAttachments;
      }
      
      debugLog('No report attachments found, checking build status...');
      
      // Every other attempt, check if build is completed
      if (attempt % 2 === 1) {
        try {
          const build = await buildClient.getBuild(projectId, buildId);
          if (build.status === Build.BuildStatus.Completed) {
            debugLog('Build is completed but no attachments found');
            break; // Exit retry loop - build is done
          }
          debugLog(`Build status: ${build.status}, continuing to wait...`);
        } catch (buildError) {
          debugLog('Failed to check build status:', buildError);
        }
      }
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      debugLog(`Attempt ${attempt + 1} failed:`, error);
      
      // If this is a permissions or connectivity issue, don't retry
      if (error instanceof Error && (
        error.message.toLowerCase().includes('permission') || 
        error.message.toLowerCase().includes('unauthorized') ||
        error.message.toLowerCase().includes('forbidden') ||
        error.message.toLowerCase().includes('access denied')
      )) {
        throw error;
      }
    }
    
    // Wait before next attempt (with jitter)
    if (attempt < BACKOFF_DELAYS.length - 1) {
      const delay = BACKOFF_DELAYS[attempt] + Math.random() * 1000;
      debugLog(`Waiting ${Math.round(delay)}ms before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    } else {
      // Use last delay value for remaining attempts
      const delay = BACKOFF_DELAYS[BACKOFF_DELAYS.length - 1] + Math.random() * 1000;
      debugLog(`Waiting ${Math.round(delay)}ms before next attempt (max backoff)...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  const elapsed = Date.now() - startTime;
  debugLog(`Timeout reached after ${elapsed}ms (${attempt + 1} attempts)`);
  
  // Log summary for troubleshooting
  if (lastError) {
    debugLog('Last error encountered:', lastError.message);
  }
  
  return []; // Return empty array if no attachments found within timeout
};

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
      // Modern SDK initialization with explicit load control
      debugLog('Initializing Bicep What-If Report Extension...');

      // Check if SDK is already initialized to prevent double loading
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(window as any).VSS_SDK_INITIALIZED) {
        await SDK.init({ loaded: false, applyTheme: true });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).VSS_SDK_INITIALIZED = true;
        debugLog('Azure DevOps SDK initialized successfully.');
      } else {
        debugLog('Azure DevOps SDK already initialized, skipping initialization.');
      }

      // Load and display reports
      debugLog('Loading Bicep What-If reports...');
      await loadReports();
      debugLog('Bicep What-If reports loaded successfully.');

      // Notify successful load
      debugLog('Notifying Azure DevOps SDK of successful load.');
      await SDK.notifyLoadSucceeded();
      debugLog('Azure DevOps SDK notified of successful load.');
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
      console.error('[BicepWhatIfTab] Extension initialization failed:', error);

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
      debugLog('Azure DevOps web context is not available');
      errors.push('Azure DevOps web context is not available');
    } else if (!webContext.project) {
      debugLog('Project context is missing from web context');
      errors.push('Project context is missing from web context');
    } else {
      debugLog(`Web context project ID: ${webContext.project.id}`);
    }

    // Try multiple approaches to get the Build ID
    let buildId: number | undefined;
    let buildIdSource = '';

    // Method 1: From BuildPageDataService (primary method for build summary pages)
    try {
      debugLog('Attempting to get Build ID from BuildPageDataService...');
      const buildPageService: IBuildPageDataService = await SDK.getService(
        BuildServiceIds.BuildPageDataService
      );
      debugLog('BuildPageDataService obtained successfully.');

      // Use the BuildPageDataService to get build data
      debugLog('Fetching build page data...');
      const buildPageData = await buildPageService.getBuildPageData();
      if (buildPageData) {
        if (buildPageData.build) {
          buildId = buildPageData.build.id;
          buildIdSource = 'build page data service';
          debugLog('Build ID obtained from BuildPageDataService:', buildPageData.build.id);
        } else {
          // Send a log with all the build page data written out to the console
          debugLog('Build ID is not available in BuildPageDataService.');
          debugLog(`Build Page Data:\n${JSON.stringify(buildPageData, null, 2)}`);
          errors.push('Build ID is not available in BuildPageDataService.');
        }
      } else {
        debugLog('Build page data is not available.');
        errors.push('Build page data is not available.');
      }
    } catch (error) {
      debugLog('Failed to get build page data service:', error);
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
      debugLog(`Build ID obtained from ${buildIdSource}: ${buildId}`);
    }

    if (buildId !== undefined) {
      try {
        // Use the proper Azure DevOps Extension API client instead of SDK.getService()
        debugLog('Getting BuildRestClient...');
        const buildClient = getClient(BuildRestClient);
        debugLog('BuildRestClient obtained successfully.');

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
          debugLog('BuildRestClient is available.');
        }

        // Get build attachments for Bicep What-If reports using retry logic
        infoLog(`Fetching attachments for build ID '${buildId}' and project '${webContext.project.id}' with type '${ATTACHMENT_TYPE}'...`);

        const reportAttachments = await fetchReportsWithRetry(buildClient, webContext.project.id, buildId);

        if (reportAttachments.length === 0) {
          infoLog('No Bicep What-If report attachments found.');
          setNoReports(true);
          return;
        }

        infoLog(`Found ${reportAttachments.length} Bicep What-If report attachments:`, reportAttachments.map(a => a.name));

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
    const startTime = Date.now();
    const reportPromises = attachments.map(async attachment => {
      try {
        // Try to parse attachment self link for direct access
        const parsedIds = parseAttachmentLink(attachment._links?.self?.href || '');
        
        if (parsedIds) {
          // Direct fetch using parsed IDs
          debugLog(`Fetching attachment ${attachment.name} directly with timelineId=${parsedIds.timelineId}, recordId=${parsedIds.recordId}`);
          
          try {
            const contentBuffer = await buildClient.getAttachment(
              projectId,
              buildId,
              parsedIds.timelineId,
              parsedIds.recordId,
              ATTACHMENT_TYPE,
              attachment.name
            );

            // Convert ArrayBuffer to string
            const content = new TextDecoder().decode(contentBuffer);
            debugLog(`Successfully fetched attachment ${attachment.name} (${content.length} chars) via direct access`);
            
            return {
              name: attachment.name,
              content: content,
            };
          } catch (directError) {
            debugLog(`Direct fetch failed for ${attachment.name}, falling back to timeline scan:`, directError);
            // Fall through to timeline-based approach
          }
        }
        
        // Fallback to timeline-based approach for compatibility
        debugLog(`Using timeline scan fallback for attachment ${attachment.name}`);
        return await fetchAttachmentViaTimeline(attachment, projectId, buildId, buildClient);
        
      } catch (error) {
        console.error('[BicepWhatIfTab] Error loading report:', attachment.name, error);
        return {
          name: attachment.name,
          content: '',
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });

    const loadedReports = await Promise.all(reportPromises);
    
    // Log summary
    const successCount = loadedReports.filter(r => !r.error).length;
    const errorCount = loadedReports.filter(r => r.error).length;
    const elapsed = Date.now() - startTime;
    
    infoLog(`Report loading completed: ${successCount} successful, ${errorCount} failed (${elapsed}ms total)`);
    
    if (errorCount > 0) {
      const errorMessages = loadedReports.filter(r => r.error).map(r => `${r.name}: ${r.error}`);
      debugLog('Attachment errors:', errorMessages);
    }
    
    setReports(loadedReports);

    // Auto-resize to fit content
    SDK.resize();
  };

  // Fallback function for attachment retrieval when direct parsing fails
  const fetchAttachmentViaTimeline = async (
    attachment: Build.Attachment,
    projectId: string,
    buildId: number,
    buildClient: BuildRestClient
  ): Promise<{ name: string; content: string; error?: string }> => {
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let retry = 0; retry < maxRetries; retry++) {
      try {
        const timeline = await buildClient.getBuildTimeline(projectId, buildId);
        
        if (!timeline || !timeline.records) {
          throw new Error('Build timeline is not available or contains no records.');
        }

        // Find a timeline record that might contain this attachment
        for (const record of timeline.records) {
          try {
            const contentBuffer = await buildClient.getAttachment(
              projectId,
              buildId,
              timeline.id,
              record.id,
              ATTACHMENT_TYPE,
              attachment.name
            );

            // Convert ArrayBuffer to string
            const content = new TextDecoder().decode(contentBuffer);
            debugLog(`Successfully fetched attachment ${attachment.name} (${content.length} chars) via timeline scan on attempt ${retry + 1}`);
            
            return {
              name: attachment.name,
              content: content,
            };
          } catch (recordError: unknown) {
            // This record doesn't have the attachment, try the next one
            debugLog(`Attachment ${attachment.name} not found in record ${record.id}, trying next record: ${String(recordError)}`);
            continue;
          }
        }

        // If we reach here, no record had the attachment
        throw new Error(`Attachment ${attachment.name} not found in any timeline record`);
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (retry < maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, retry), 5000); // Exponential backoff up to 5s
          debugLog(`Timeline fetch attempt ${retry + 1} failed for ${attachment.name}, retrying in ${delay}ms:`, error);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          debugLog(`All timeline fetch attempts failed for ${attachment.name}:`, error);
        }
      }
    }
    
    return {
      name: attachment.name,
      content: '',
      error: lastError?.message || 'Unknown error during timeline-based attachment retrieval',
    };
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
