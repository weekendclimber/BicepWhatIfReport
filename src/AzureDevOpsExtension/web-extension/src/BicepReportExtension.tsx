import React, { useState, useEffect } from 'react';
import * as SDK from 'azure-devops-extension-sdk';
import { getAccessToken } from 'azure-devops-extension-sdk';
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
import { CommonServiceIds, IProjectPageService } from 'azure-devops-extension-api';

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
      // Initialize SDK following SpotCheck pattern exactly
      console.log('Initializing Bicep What-If Report Extension...');

      // SpotCheck pattern: simple init then ready
      SDK.init();
      await SDK.ready();
      console.log('Azure DevOps SDK initialized successfully.');

      // Load and display reports
      console.log('Loading Bicep What-If reports...');
      await loadReports();
      console.log('Bicep What-If reports loaded successfully.');
    } catch (error) {
      // Handle missing Build ID context gracefully - this is an expected scenario
      // when the extension is accessed outside of a build pipeline context
      if (error instanceof Error && error.message.includes('Required context not available')) {
        setError(error.message);
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
      console.log(`Web context project name: ${webContext.project.name}`);
    }

    // Get project information using SpotCheck approach as fallback
    let projectName = webContext?.project?.name;
    if (!projectName) {
      try {
        console.log('Attempting to get project via ProjectPageService...');
        const projectPageService = await SDK.getService<IProjectPageService>(
          CommonServiceIds.ProjectPageService
        );
        const project = await projectPageService.getProject();
        if (project?.name) {
          projectName = project.name;
          console.log(`Project name obtained from ProjectPageService: ${projectName}`);
        }
      } catch (projectError) {
        console.warn('Could not get project from ProjectPageService:', projectError);
      }
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

    if (!projectName) {
      errors.push('Project name is not available from web context or ProjectPageService');
    }

    if (errors.length > 0) {
      const detailedError =
        `Required context not available. Missing:\n\t${errors.join('\n\t')}\n` +
        `This extension must be used within an Azure DevOps build pipeline tab.\n` +
        `Debug info: Current URL: ${window.location.href}\n` +
        `Configuration: ${JSON.stringify(config)}\n` +
        `Web context project: ${webContext?.project?.id || 'undefined'}\n` +
        `Project name: ${projectName || 'undefined'}`;
      throw new Error(detailedError);
    } else {
      console.log(`Project name confirmed: ${projectName}`);
      console.log(`Build ID obtained from ${buildIdSource}: ${buildId}`);
    }

    if (buildId !== undefined) {
      try {
        // Use the proper Azure DevOps Extension API client
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

        // Check if we can get access token for authentication diagnostics
        try {
          const accessToken = await getAccessToken();
          console.log('Access token obtained successfully:', accessToken ? 'Yes' : 'No');
        } catch (tokenError) {
          console.warn('Could not obtain access token:', tokenError);
        }

        // Get build artifacts for Bicep What-If reports (following SpotCheck pattern exactly)
        console.log(`Fetching artifacts for build ID '${buildId}' and project '${projectName}'...`);

        // Add detailed parameter logging for troubleshooting
        console.log('Parameters for getArtifacts call:');
        console.log(`  - project: "${projectName}" (type: ${typeof projectName})`);
        console.log(`  - buildId: ${buildId} (type: ${typeof buildId})`);

        // Use the artifact-based approach that matches the pipeline task upload method
        // Following SpotCheck pattern with getArtifacts using project name (not ID)
        let artifacts: Build.BuildArtifact[];
        try {
          const timeoutMs = 30000; // 30 second timeout
          console.log(`Setting ${timeoutMs}ms timeout for getArtifacts call...`);

          artifacts = await Promise.race([
            buildClient.getArtifacts(projectName, buildId),
            new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error(`getArtifacts call timed out after ${timeoutMs}ms`)),
                timeoutMs
              )
            ),
          ]);

          console.log(`getArtifacts call completed successfully.`);
        } catch (timeoutError) {
          console.error('getArtifacts call failed:', timeoutError);
          throw new Error(
            `Failed to retrieve build artifacts (call timed out after 30s). ` +
              `This indicates:\n` +
              `1. No artifacts exist for this build\n` +
              `2. The build may not have completed successfully\n` +
              `3. Network connectivity or permissions issue\n` +
              `Please verify the BicepWhatIfReport task ran successfully and uploaded artifacts.`
          );
        }

        console.log(`Found ${artifacts.length} artifacts for build ${buildId}`);

        // Filter for BicepWhatIfReports artifacts (matches task artifact name)
        const reportArtifacts = artifacts.filter(
          artifact => artifact.name === 'BicepWhatIfReports'
        );

        if (reportArtifacts.length === 0) {
          console.log('No BicepWhatIfReports artifacts found.');
          console.log(
            'Available artifacts:',
            artifacts.map(a => a.name)
          );
          setNoReports(true);
          return;
        }

        console.log(
          `Found ${reportArtifacts.length} BicepWhatIfReports artifacts:`,
          reportArtifacts.map(a => a.name)
        );

        // Display the reports from the artifacts
        await displayReports(reportArtifacts); //, projectName, buildId, buildClient);
      } catch (error) {
        throw new Error(
          `Failed to load Bicep What-If reports: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  };

  const displayReports = async (
    artifacts: Build.BuildArtifact[]
    //projectName: string,
    //buildId: number,
    //buildClient: BuildRestClient
  ): Promise<void> => {
    // Process each artifact to extract markdown reports
    const reportPromises = artifacts.map(async artifact => {
      try {
        console.log(`Processing artifact: ${artifact.name}`);

        // Get the download URL from the artifact resource
        if (!artifact.resource?.downloadUrl) {
          throw new Error(`Artifact ${artifact.name} has no download URL`);
        }

        console.log(`Downloading artifact from: ${artifact.resource.downloadUrl}`);

        // Download the artifact content
        const response = await fetch(artifact.resource.downloadUrl);
        if (!response.ok) {
          throw new Error(`Failed to download artifact: ${response.status} ${response.statusText}`);
        }

        // Get the content as array buffer
        const arrayBuffer = await response.arrayBuffer();
        console.log(`Downloaded ${arrayBuffer.byteLength} bytes for artifact ${artifact.name}`);

        // Check if this is a ZIP file (artifacts are typically zipped)
        const uint8Array = new Uint8Array(arrayBuffer);
        const isZip = uint8Array[0] === 0x50 && uint8Array[1] === 0x4b; // ZIP file signature

        if (isZip) {
          // Use JSZip to extract the ZIP content (following SpotCheck pattern)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const JSZip = (window as any).JSZip;
          if (!JSZip) {
            throw new Error('JSZip library not available. Please ensure jszip is loaded.');
          }

          const zip = await JSZip.loadAsync(arrayBuffer);
          const reports: ReportItem[] = [];

          // Extract all markdown files from the ZIP
          for (const fileName in zip.files) {
            const file = zip.files[fileName];
            if (!file.dir && fileName.endsWith('.md')) {
              console.log(`Extracting markdown file: ${fileName}`);
              const content = await file.async('string');
              reports.push({
                name: fileName,
                content: content,
              });
            }
          }

          return reports;
        } else {
          // If it's not a ZIP, treat it as a single markdown file
          const content = new TextDecoder().decode(arrayBuffer);
          return [
            {
              name: artifact.name + '.md',
              content: content,
            },
          ];
        }
      } catch (error) {
        console.error('Error processing artifact:', artifact.name, error);
        return [
          {
            name: artifact.name,
            content: '',
            error: error instanceof Error ? error.message : String(error),
          },
        ];
      }
    });

    // Wait for all artifacts to be processed
    const artifactResults = await Promise.all(reportPromises);

    // Flatten the results (each artifact might contain multiple markdown files)
    const allReports = artifactResults.flat();

    console.log(`Extracted ${allReports.length} total reports from artifacts`);
    setReports(allReports);

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
