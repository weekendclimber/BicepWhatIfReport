import React from 'react';
import * as SDK from 'azure-devops-extension-sdk';
import { ReportItem } from './types';
import { downloadArtifacts } from './ArtifactService';

// Azure DevOps UI Components
import { Header, TitleSize } from 'azure-devops-ui/Header';
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner';
import { MessageBar, MessageBarSeverity } from 'azure-devops-ui/MessageBar';
import { Card } from 'azure-devops-ui/Card';
import { ZeroData } from 'azure-devops-ui/ZeroData';

// Azure DevOps UI Core
import 'azure-devops-ui/Core/_platformCommon.scss';

interface IPanelContentState {
  phase: 'init' | 'loading' | 'done' | 'error';
  reports?: ReportItem[];
  status?: string;
  debugInfo: string[];
}

export class BicepReportSpotCheck extends React.Component<{}, IPanelContentState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      phase: 'init',
      debugInfo: [],
    };
  }

  private addDebugInfo = (message: string) => {
    const timestamp = new Date().toISOString();
    const debugMessage = `[${timestamp}] ${message}`;
    console.log(debugMessage);
    this.setState(prevState => ({
      debugInfo: [...prevState.debugInfo, debugMessage],
    }));
  };

  public async componentDidMount() {
    try {
      this.addDebugInfo('Starting Bicep Report Extension (SpotCheck pattern)');

      // SpotCheck's exact pattern: SDK.init() followed by await SDK.ready()
      SDK.init();
      await SDK.ready();

      this.addDebugInfo('Azure DevOps SDK initialized and ready');

      // Auto-resize to fit content
      SDK.resize();

      // Load reports without artificial timeout
      await this.loadReports();
    } catch (error) {
      this.addDebugInfo(`SDK initialization failed: ${error}`);
      this.setState({
        phase: 'error',
        status: `Failed to initialize Azure DevOps SDK: ${error}`,
      });
    }
  }

  private async loadReports(): Promise<void> {
    try {
      this.addDebugInfo('Starting artifact download (SpotCheck pattern - no timeout wrapper)');
      this.setState({ phase: 'loading' });

      // Call downloadArtifacts directly without Promise.race timeout - SpotCheck pattern
      const artifactEntries = await downloadArtifacts('BicepWhatIfReports');

      this.addDebugInfo(`Download completed. Found ${artifactEntries?.length || 0} files`);

      if (!artifactEntries || artifactEntries.length === 0) {
        this.addDebugInfo('No BicepWhatIfReports artifacts found.');
        this.setState({
          phase: 'done',
          status: 'No Bicep What-If reports found for this build.',
        });
        return;
      }

      this.addDebugInfo(
        `Found ${artifactEntries.length} report files: ${artifactEntries.map(e => e.name).join(', ')}`
      );

      // Convert artifact entries to report items
      const reportItems: ReportItem[] = artifactEntries.map(entry => ({
        name: entry.name,
        content: entry.content,
      }));

      this.addDebugInfo(`Successfully loaded ${reportItems.length} reports`);
      this.setState({
        phase: 'done',
        reports: reportItems,
      });

      // Auto-resize to fit content
      SDK.resize();
    } catch (error) {
      this.addDebugInfo(`Failed to load reports: ${error}`);

      // Handle missing Build ID context gracefully
      if (error instanceof Error && error.message.includes('Required context not available')) {
        this.setState({
          phase: 'error',
          status: error.message,
        });
        return;
      }

      // Handle other errors
      let errorMessage = 'Failed to load Bicep What-If reports.';
      if (error instanceof Error) {
        if (error.message.includes('SDK')) {
          errorMessage =
            'Failed to access Azure DevOps SDK. Please ensure this extension is running within Azure DevOps.';
        } else {
          errorMessage = `Extension error: ${error.message}`;
        }
      }

      this.setState({
        phase: 'error',
        status: errorMessage,
      });
    }
  }

  private sanitizeHtml = (html: string): string => {
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

          // Remove any event handler attributes
          if (attrName.startsWith('on')) {
            child.removeAttribute(attr.name);
            continue;
          }

          // Remove any style attributes
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

  private parseMarkdown = (content: string): string => {
    // Check if marked library is available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (window as any).marked !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsedHtml = (window as any).marked.parse(content);
      return this.sanitizeHtml(parsedHtml);
    } else {
      // Fallback to plain text
      return content;
    }
  };

  private getDisplayName = (name: string): string => {
    return name.replace('md/', '').replace(/^[0-9]+/g, '');
  };

  public render(): JSX.Element {
    const { phase, reports, status, debugInfo } = this.state;

    // Loading state
    if (phase === 'init' || phase === 'loading') {
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

    // Error state
    if (phase === 'error') {
      return (
        <div className="flex-grow">
          <Header title="Bicep What-If Report" titleSize={TitleSize.Large} />
          <div className="page-content page-content-top">
            <MessageBar
              severity={MessageBarSeverity.Error}
              messageClassName="font-family-monospace"
            >
              {status}
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

    // No reports found
    if (phase === 'done' && (!reports || reports.length === 0)) {
      return (
        <div className="flex-grow">
          <Header title="Bicep What-If Report" titleSize={TitleSize.Large} />
          <div className="page-content page-content-top">
            <ZeroData
              primaryText="No Bicep What-If reports found"
              secondaryText={status || 'No Bicep What-If reports found for this build.'}
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

    // Success state with reports
    return (
      <div className="flex-grow">
        <Header title="Bicep What-If Report" titleSize={TitleSize.Large} />
        <div className="page-content page-content-top">
          <div className="flex-column rhythm-vertical-16">
            {reports!.map((report, index) => (
              <Card
                key={index}
                collapsible={true}
                collapsed={false}
                titleProps={{
                  text: this.getDisplayName(report.name),
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
                      __html: this.parseMarkdown(report.content),
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
  }
}
