// Use the global SDK that's loaded via script tag
declare const SDK: any;

interface IBuildService {
    getBuild(projectId: string, buildId: number): Promise<any>;
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
            this.showError('Failed to initialize the extension. Please try again later.');
            await SDK.notifyLoadFailed(error instanceof Error ? error : new Error(String(error)));
        }
    }

    private async loadReports(): Promise<void> {
        const webContext = SDK.getWebContext();
        const config = SDK.getConfiguration();
        
        if (!webContext.project || !config.buildId) {
            throw new Error('Required context not available');
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

    private async displayReports(attachments: any[], projectId: string, buildId: number): Promise<void> {
        const reportList = document.getElementById('report-list')!;
        
        for (const attachment of attachments) {
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
        }

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
        
        const displayName = name.replace('md/', '').replace(/\^[0-9]+/g, '');
        summary.textContent = displayName;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'markdown-content';
        
        // Use marked library if available
        if (typeof (window as any).marked !== 'undefined') {
            contentDiv.innerHTML = (window as any).marked.parse(content);
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