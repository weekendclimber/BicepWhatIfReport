import React, { useState, useEffect } from 'react';
import * as SDK from 'azure-devops-extension-sdk';
import { ReportItem } from './types';
import { downloadArtifacts } from './ArtifactService';

// Azure DevOps UI Components
import { Header, TitleSize } from 'azure-devops-ui/Header';
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner';
import { MessageBar, MessageBarSeverity } from 'azure-devops-ui/MessageBar';
import { Card } from 'azure-devops-ui/Card';
import { ZeroData } from 'azure-devops-ui/ZeroData';

// Azure DevOps UI Core and utilities
import 'azure-devops-ui/Core/_platformCommon.scss';

interface BicepReportState {
  phase: 'init' | 'sdk-loading' | 'loading-artifacts' | 'processing' | 'done' | 'error';
  loading: boolean;
  error: string | null;
  reports: ReportItem[];
  noReports: boolean;
  debugInfo: string[];
}

const BicepReportExtension: React.FC = () => {
  const [state, setState] = useState<BicepReportState>({
    phase: 'init',
    loading: true,
    error: null,
    reports: [],
    noReports: false,
    debugInfo: [],
  });

  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toISOString();
    const debugMessage = `[${timestamp}] ${message}`;
    console.log(debugMessage);
    setState(prev => ({
      ...prev,
      debugInfo: [...prev.debugInfo, debugMessage],
    }));
  };

  useEffect(() => {
    initializeExtension();
  }, []);

  const initializeExtension = async (): Promise<void> => {
    try {
      addDebugInfo('Starting Bicep Report Extension initialization (SpotCheck pattern)');

      setState(prev => ({ ...prev, phase: 'sdk-loading' }));
      addDebugInfo('Initializing Azure DevOps SDK...');

      // SpotCheck pattern: SDK.init() followed by await SDK.ready()
      SDK.init();
      await SDK.ready();

      addDebugInfo('Azure DevOps SDK ready');
      setState(prev => ({ ...prev, phase: 'loading-artifacts' }));

      // Auto-resize to fit content
      SDK.resize();

      // Small delay before loading artifacts (like SpotCheck does)
      setTimeout(loadReports, 500);
    } catch (error) {
      addDebugInfo(`SDK initialization failed: ${error}`);
      setState(prev => ({
        ...prev,
        phase: 'error',
        loading: false,
        error: `Failed to initialize Azure DevOps SDK: ${error}`,
      }));
    }
  };

  const loadReports = async (): Promise<void> => {
    try {
      addDebugInfo('Starting artifact download using SpotCheck pattern...');
      setState(prev => ({ ...prev, phase: 'processing' }));

      // Use SpotCheck's exact downloadArtifacts pattern with timeout
      const timeoutMs = 45000; // 45 seconds timeout
      const artifactPromise = downloadArtifacts('BicepWhatIfReports');

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              `Artifact download timed out after ${timeoutMs / 1000} seconds. This may indicate an authorization or network issue.`
            )
          );
        }, timeoutMs);
      });

      addDebugInfo(`Downloading artifacts with ${timeoutMs / 1000}s timeout...`);
      const artifactEntries = await Promise.race([artifactPromise, timeoutPromise]);

      addDebugInfo(`Download completed. Found ${artifactEntries?.length || 0} files`);

      if (!artifactEntries || artifactEntries.length === 0) {
        addDebugInfo('No BicepWhatIfReports artifacts found.');
        setState(prev => ({
          ...prev,
          phase: 'done',
          noReports: true,
          loading: false,
        }));
        return;
      }

      addDebugInfo(
        `Found ${artifactEntries.length} report files: ${artifactEntries.map(e => e.name).join(', ')}`
      );

      // Convert artifact entries to report items
      const reportItems: ReportItem[] = artifactEntries.map(entry => ({
        name: entry.name,
        content: entry.content,
      }));

      addDebugInfo(`Successfully loaded ${reportItems.length} reports`);
      setState(prev => ({
        ...prev,
        phase: 'done',
        reports: reportItems,
        loading: false,
      }));

      // Auto-resize to fit content
      SDK.resize();
    } catch (error) {
      addDebugInfo(`Failed to load reports: ${error}`);

      // Handle missing Build ID context gracefully - this is an expected scenario
      // when the extension is accessed outside of a build pipeline context
      if (error instanceof Error && error.message.includes('Required context not available')) {
        setState(prev => ({
          ...prev,
          phase: 'error',
          error: error.message,
          loading: false,
        }));
        return;
      }

      // Handle timeout specifically
      if (error instanceof Error && error.message.includes('timed out')) {
        setState(prev => ({
          ...prev,
          phase: 'error',
          error: `Artifact download timeout: ${error.message}. Please check the debug logs below for more details.`,
          loading: false,
        }));
        return;
      }

      // Handle other initialization errors that indicate real failures
      let errorMessage = 'Failed to load Bicep What-If reports.';
      if (error instanceof Error) {
        if (error.message.includes('SDK')) {
          errorMessage =
            'Failed to access Azure DevOps SDK. Please ensure this extension is running within Azure DevOps.';
        } else {
          errorMessage = `Extension error: ${error.message}`;
        }
      }

      setState(prev => ({
        ...prev,
        phase: 'error',
        error: errorMessage,
        loading: false,
      }));
    }
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
  }, [state.reports, state.error, state.noReports]);

  const { phase, loading, error, reports, noReports, debugInfo } = state;

  if (loading) {
    return (
      <div className="flex-grow">
        <Header title="Bicep What-If Report" titleSize={TitleSize.Large} />
        <div className="page-content page-content-top">
          <Spinner
            size={SpinnerSize.large}
            label={`Loading Bicep What-If reports... (${phase})`}
            ariaLabel="Loading Bicep What-If reports"
          />
          {debugInfo.length > 0 && (
            <Card
              collapsible={true}
              collapsed={true}
              titleProps={{
                text: 'Debug Information',
                size: TitleSize.Small,
              }}
              contentProps={{
                contentPadding: true,
              }}
            >
              <div style={{ fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                {debugInfo.join('\n')}
              </div>
            </Card>
          )}
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
          {debugInfo.length > 0 && (
            <Card
              collapsible={true}
              collapsed={false}
              titleProps={{
                text: 'Debug Information',
                size: TitleSize.Small,
              }}
              contentProps={{
                contentPadding: true,
              }}
            >
              <div style={{ fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                {debugInfo.join('\n')}
              </div>
            </Card>
          )}
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
          {debugInfo.length > 0 && (
            <Card
              collapsible={true}
              collapsed={true}
              titleProps={{
                text: 'Debug Information',
                size: TitleSize.Small,
              }}
              contentProps={{
                contentPadding: true,
              }}
            >
              <div style={{ fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                {debugInfo.join('\n')}
              </div>
            </Card>
          )}
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
          {debugInfo.length > 0 && (
            <Card
              collapsible={true}
              collapsed={true}
              titleProps={{
                text: 'Debug Information',
                size: TitleSize.Small,
              }}
              contentProps={{
                contentPadding: true,
              }}
            >
              <div style={{ fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                {debugInfo.join('\n')}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BicepReportExtension;
