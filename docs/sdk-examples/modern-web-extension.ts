/**
 * Modern Web Extension Example using Azure DevOps Extension SDK v4
 * 
 * This example demonstrates how to create a modern web extension that:
 * - Uses TypeScript and modern async/await patterns
 * - Properly handles initialization and lifecycle
 * - Accesses build service and attachments
 * - Implements proper error handling
 * - Follows best practices for SDK v4
 * 
 * Based on the existing Bicep What-If Report extension
 */

import * as SDK from 'azure-devops-extension-sdk';

// Define interfaces for type safety
interface IBuildService {
    getBuild(projectId: string, buildId: number): Promise<any>;
    getBuildAttachments(projectId: string, buildId: number, type: string): Promise<any[]>;
    getAttachment(projectId: string, buildId: number, type: string, name: string): Promise<string>;
}

interface IExtensionDataService {
    getValue<T>(key: string, defaultValue?: T): Promise<T>;
    setValue<T>(key: string, value: T): Promise<T>;
}

interface BuildAttachment {
    name: string;
    type: string;
}

interface ReportItem {
    name: string;
    content: string;
    displayName: string;
}

class ModernBicepReportExtension {
    private buildService?: IBuildService;
    private dataService?: IExtensionDataService;
    private isInitialized = false;

    /**
     * Initialize the extension using modern SDK v4 patterns
     */
    async initialize(): Promise<void> {
        try {
            console.log('Initializing Bicep What-If Report Extension...');

            // Initialize SDK with explicit load notification
            await SDK.init({ 
                loaded: false,    // We'll notify when ready
                applyTheme: true  // Apply Azure DevOps theme
            });

            // Get context information for debugging and validation
            this.logContextInformation();

            // Initialize services
            await this.initializeServices();

            // Setup the UI
            await this.setupUI();

            // Load and display reports
            await this.loadReports();

            // Mark as successfully loaded
            this.isInitialized = true;
            await SDK.notifyLoadSucceeded();
            
            console.log('Extension initialized successfully');

        } catch (error) {
            console.error('Extension initialization failed:', error);
            await SDK.notifyLoadFailed(error);
            this.showError(`Failed to initialize extension: ${error.message}`);
        }
    }

    /**
     * Log all available context information for debugging
     */
    private logContextInformation(): void {
        try {
            // User context
            const user = SDK.getUser();
            console.log('User Context:', {
                id: user.id,
                name: user.name,
                displayName: user.displayName,
                imageUrl: user.imageUrl
            });

            // Host context
            const host = SDK.getHost();
            console.log('Host Context:', {
                id: host.id,
                name: host.name,
                serviceVersion: host.serviceVersion,
                type: host.type,
                isHosted: host.isHosted
            });

            // Web context
            const webContext = SDK.getWebContext();
            console.log('Web Context:', {
                project: webContext.project,
                team: webContext.team
            });

            // Extension context
            const extension = SDK.getExtensionContext();
            console.log('Extension Context:', {
                id: extension.id,
                publisherId: extension.publisherId,
                extensionId: extension.extensionId,
                version: extension.version
            });

            // Configuration
            const config = SDK.getConfiguration();
            console.log('Configuration:', config);

        } catch (error) {
            console.warn('Failed to log context information:', error);
        }
    }

    /**
     * Initialize required services with proper error handling
     */
    private async initializeServices(): Promise<void> {
        try {
            // Get build service for accessing build data and attachments
            this.buildService = await SDK.getService<IBuildService>('ms.vss-build-web.build-service');
            if (!this.buildService) {
                throw new Error('Build service not available');
            }

            // Get extension data service for user preferences/settings
            this.dataService = await SDK.getService<IExtensionDataService>('ms.vss-features.extension-data-service');
            if (!this.dataService) {
                throw new Error('Extension data service not available');
            }

            console.log('Services initialized successfully');
        } catch (error) {
            console.error('Service initialization failed:', error);
            throw new Error(`Service initialization failed: ${error.message}`);
        }
    }

    /**
     * Setup the UI and apply theme
     */
    private async setupUI(): Promise<void> {
        try {
            // Create main container
            const container = this.createContainer();
            document.body.appendChild(container);

            // Apply Azure DevOps theme
            this.applyTheme();

            // Auto-resize to fit content
            SDK.resize();

            console.log('UI setup completed');
        } catch (error) {
            console.error('UI setup failed:', error);
            throw error;
        }
    }

    /**
     * Create the main UI container
     */
    private createContainer(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'bicep-report-container';
        container.innerHTML = `
            <div class="header">
                <h1>Bicep What-If Report</h1>
            </div>
            <div id="loading" class="loading">
                Loading Bicep What-If reports...
            </div>
            <div id="error" class="error" style="display: none;"></div>
            <div id="content" class="report-content" style="display: none;">
                <div id="no-reports" class="no-reports" style="display: none;">
                    No Bicep What-If reports found for this build.
                </div>
                <ul id="report-list" class="report-list"></ul>
            </div>
        `;
        return container;
    }

    /**
     * Apply Azure DevOps theme using SDK v4
     */
    private applyTheme(): void {
        try {
            // Get page context for theme information
            const pageContext = SDK.getPageContext();
            const theme = pageContext.globalization.theme;
            
            console.log('Applying theme:', theme);

            // You can also apply custom theme variables
            const themeData = {
                '--primary-color': '#0078d4',
                '--background-color': theme === 'dark' ? '#1f1f1f' : '#ffffff',
                '--text-color': theme === 'dark' ? '#ffffff' : '#323130',
                '--border-color': theme === 'dark' ? '#404040' : '#e1e8ed'
            };

            SDK.applyTheme(themeData);
        } catch (error) {
            console.warn('Theme application failed:', error);
        }
    }

    /**
     * Load and display Bicep What-If reports from build attachments
     */
    private async loadReports(): Promise<void> {
        try {
            if (!this.buildService) {
                throw new Error('Build service not initialized');
            }

            // Get build information from configuration and context
            const config = SDK.getConfiguration();
            const webContext = SDK.getWebContext();

            if (!config.buildId) {
                throw new Error('Build ID not available in configuration');
            }

            if (!webContext.project) {
                throw new Error('Project context not available');
            }

            const buildId = parseInt(config.buildId);
            console.log(`Loading reports for build ${buildId} in project ${webContext.project.name}`);

            // Get build attachments of our specific type
            const attachments = await this.buildService.getBuildAttachments(
                webContext.project.id, 
                buildId, 
                'bicepwhatifreport'
            );

            console.log(`Found ${attachments.length} attachments`);

            // Filter for markdown reports
            const reportAttachments = attachments.filter(attachment => 
                attachment.name.startsWith('md/')
            );

            if (reportAttachments.length === 0) {
                this.showNoReports();
                return;
            }

            // Load and display each report
            const reports = await this.loadReportContents(reportAttachments, webContext.project.id, buildId);
            this.displayReports(reports);

        } catch (error) {
            console.error('Failed to load reports:', error);
            this.showError(`Failed to load reports: ${error.message}`);
        }
    }

    /**
     * Load the content of each report attachment
     */
    private async loadReportContents(
        attachments: BuildAttachment[], 
        projectId: string, 
        buildId: number
    ): Promise<ReportItem[]> {
        const reports: ReportItem[] = [];

        for (const attachment of attachments) {
            try {
                console.log(`Loading content for attachment: ${attachment.name}`);
                
                const content = await this.buildService!.getAttachment(
                    projectId,
                    buildId,
                    'bicepwhatifreport',
                    attachment.name
                );

                // Clean up display name
                const displayName = attachment.name
                    .replace('md/', '')
                    .replace(/\^[0-9]+/g, ''); // Remove escape sequences

                reports.push({
                    name: attachment.name,
                    content: content,
                    displayName: displayName
                });

            } catch (error) {
                console.error(`Failed to load attachment ${attachment.name}:`, error);
                
                // Add error item instead of failing completely
                reports.push({
                    name: attachment.name,
                    content: `Error loading report: ${error.message}`,
                    displayName: `${attachment.name} (Error)`
                });
            }
        }

        return reports;
    }

    /**
     * Display the loaded reports in the UI
     */
    private displayReports(reports: ReportItem[]): void {
        try {
            const reportList = document.getElementById('report-list')!;
            const loadingDiv = document.getElementById('loading')!;
            const contentDiv = document.getElementById('content')!;

            // Clear existing content
            reportList.innerHTML = '';

            // Create report items
            reports.forEach(report => {
                const reportElement = this.createReportElement(report);
                reportList.appendChild(reportElement);
            });

            // Show content and hide loading
            loadingDiv.style.display = 'none';
            contentDiv.style.display = 'block';

            // Resize to fit new content
            SDK.resize();

            console.log(`Displayed ${reports.length} reports`);

        } catch (error) {
            console.error('Failed to display reports:', error);
            this.showError(`Failed to display reports: ${error.message}`);
        }
    }

    /**
     * Create a UI element for a single report
     */
    private createReportElement(report: ReportItem): HTMLElement {
        const li = document.createElement('li');
        li.className = 'report-item';

        const details = document.createElement('details');
        const summary = document.createElement('summary');
        summary.textContent = report.displayName;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'markdown-content';

        // Convert markdown to HTML if marked is available (loaded via CDN)
        if (typeof (window as any).marked !== 'undefined') {
            contentDiv.innerHTML = (window as any).marked.parse(report.content);
        } else {
            // Fallback to plain text
            const pre = document.createElement('pre');
            pre.textContent = report.content;
            contentDiv.appendChild(pre);
        }

        details.appendChild(summary);
        details.appendChild(contentDiv);
        li.appendChild(details);

        return li;
    }

    /**
     * Show error message in the UI
     */
    private showError(message: string): void {
        const errorDiv = document.getElementById('error')!;
        const loadingDiv = document.getElementById('loading')!;

        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        loadingDiv.style.display = 'none';

        // Resize to fit error message
        SDK.resize();
    }

    /**
     * Show no reports message
     */
    private showNoReports(): void {
        const noReportsDiv = document.getElementById('no-reports')!;
        const loadingDiv = document.getElementById('loading')!;
        const contentDiv = document.getElementById('content')!;

        loadingDiv.style.display = 'none';
        contentDiv.style.display = 'block';
        noReportsDiv.style.display = 'block';

        // Resize to fit content
        SDK.resize();
    }

    /**
     * Save user preferences using extension data service
     */
    async saveUserPreferences(preferences: any): Promise<void> {
        try {
            if (!this.dataService) {
                throw new Error('Extension data service not available');
            }

            await this.dataService.setValue('bicep-report-preferences', preferences);
            console.log('User preferences saved');
        } catch (error) {
            console.error('Failed to save user preferences:', error);
        }
    }

    /**
     * Load user preferences using extension data service
     */
    async loadUserPreferences(): Promise<any> {
        try {
            if (!this.dataService) {
                throw new Error('Extension data service not available');
            }

            const preferences = await this.dataService.getValue('bicep-report-preferences', {
                autoRefresh: false,
                theme: 'auto'
            });
            
            console.log('User preferences loaded:', preferences);
            return preferences;
        } catch (error) {
            console.error('Failed to load user preferences:', error);
            return {};
        }
    }

    /**
     * Get access token for API calls (example)
     */
    async getAccessToken(): Promise<string> {
        try {
            const token = await SDK.getAccessToken();
            console.log('Access token obtained');
            return token;
        } catch (error) {
            console.error('Failed to get access token:', error);
            throw error;
        }
    }

    /**
     * Example of making authenticated API call
     */
    async callAzureDevOpsApi(endpoint: string): Promise<any> {
        try {
            const token = await this.getAccessToken();
            const host = SDK.getHost();
            
            const response = await fetch(`https://${host.name}/_apis/${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API call failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }
}

// Initialize the extension when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const extension = new ModernBicepReportExtension();
    extension.initialize();
});

// Export for use in other modules
export { ModernBicepReportExtension };