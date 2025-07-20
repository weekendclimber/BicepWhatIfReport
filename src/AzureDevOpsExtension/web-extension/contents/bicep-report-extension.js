"use strict";
class BicepReportExtension {
    async initialize() {
        try {
            // Modern SDK initialization
            await SDK.init({ loaded: false, applyTheme: true });
            // Get services
            this.buildService = await SDK.getService('ms.vss-build-web.build-service');
            // Load and display reports
            await this.loadReports();
            // Notify successful load
            await SDK.notifyLoadSucceeded();
        }
        catch (error) {
            // Handle missing Build ID context gracefully - this is an expected scenario
            // when the extension is accessed outside of a build pipeline context
            if (error instanceof Error && error.message.includes('Required context not available')) {
                this.showError(error.message);
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
                }
                else {
                    errorMessage = `Extension error: ${error.message}`;
                }
            }
            this.showError(errorMessage);
            await SDK.notifyLoadFailed(error instanceof Error ? error : new Error(String(error)));
        }
    }
    async loadReports() {
        const webContext = SDK.getWebContext();
        const config = SDK.getConfiguration();
        // Enhanced context validation with detailed error messages
        const errors = [];
        if (!webContext) {
            errors.push('Azure DevOps web context is not available');
        }
        else {
            if (!webContext.project) {
                errors.push('Project context is missing from web context');
            }
        }
        // Try multiple approaches to get the Build ID
        let buildId = null;
        let buildIdSource = '';
        // Method 1: From configuration (standard approach)
        if (config && config.buildId) {
            buildId = parseInt(config.buildId);
            buildIdSource = 'configuration';
        }
        // Method 2: From URL parameters (fallback for build result tabs)
        if (!buildId) {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const buildIdFromUrl = urlParams.get('buildId');
                if (buildIdFromUrl) {
                    buildId = parseInt(buildIdFromUrl);
                    buildIdSource = 'URL parameters';
                }
            }
            catch (error) {
                console.debug('Failed to extract build ID from URL:', error);
            }
        }
        // Method 3: From URL path (build results page pattern)
        if (!buildId) {
            try {
                // Azure DevOps build URLs typically have pattern: .../build/results?buildId=123
                // or .../_build/results?buildId=123
                const pathMatch = window.location.pathname.match(/\/_build\/results/);
                if (pathMatch) {
                    const urlParams = new URLSearchParams(window.location.search);
                    const buildIdFromUrl = urlParams.get('buildId');
                    if (buildIdFromUrl) {
                        buildId = parseInt(buildIdFromUrl);
                        buildIdSource = 'URL path pattern';
                    }
                }
            }
            catch (error) {
                console.debug('Failed to extract build ID from URL path:', error);
            }
        }
        // Method 4: From host page data service (advanced approach)
        if (!buildId) {
            try {
                const hostPageDataService = await SDK.getService('ms.vss-tfs-web.tfs-page-data-service');
                if (hostPageDataService && hostPageDataService.getPageData) {
                    const pageData = await hostPageDataService.getPageData();
                    if (pageData && pageData.buildId) {
                        buildId = parseInt(pageData.buildId);
                        buildIdSource = 'host page data service';
                    }
                }
            }
            catch (error) {
                console.debug('Failed to get build ID from host page data service:', error);
            }
        }
        if (!buildId) {
            errors.push('Build ID is not available from any source (configuration, URL, or page context)');
        }
        if (errors.length > 0) {
            const detailedError = `Required context not available. Missing: ${errors.join(', ')}. ` +
                `This extension must be used within an Azure DevOps build pipeline tab. ` +
                `Debug info: Current URL: ${window.location.href}, ` +
                `Configuration: ${JSON.stringify(config)}, ` +
                `Web context project: ${webContext?.project?.id || 'undefined'}`;
            throw new Error(detailedError);
        }
        console.log(`Build ID obtained from ${buildIdSource}: ${buildId}`);
        const attachments = await this.buildService.getBuildAttachments(webContext.project.id, buildId, 'bicepwhatifreport');
        const reports = attachments.filter(att => att.name.startsWith('md/'));
        if (reports.length === 0) {
            this.showNoReports();
            return;
        }
        await this.displayReports(reports, webContext.project.id, buildId);
    }
    async displayReports(attachments, projectId, buildId) {
        const reportList = document.getElementById('report-list');
        const fetchPromises = attachments.map(async (attachment) => {
            try {
                const content = await this.buildService.getAttachment(projectId, buildId, 'bicepwhatifreport', attachment.name);
                const reportElement = this.createReportElement(attachment.name, content);
                reportList.appendChild(reportElement);
            }
            catch (error) {
                console.error('Error loading report:', attachment.name, error);
                const errorElement = this.createErrorElement(attachment.name, error);
                reportList.appendChild(errorElement);
            }
        });
        document.getElementById('loading').style.display = 'none';
        document.getElementById('content').style.display = 'block';
        // Auto-resize to fit content
        SDK.resize();
    }
    createReportElement(name, content) {
        const li = document.createElement('li');
        li.className = 'report-item';
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        const displayName = name.replace('md/', '').replace(/^[0-9]+/g, '');
        summary.textContent = displayName;
        const contentDiv = document.createElement('div');
        contentDiv.className = 'markdown-content';
        // Use marked library if available
        if (typeof window.marked !== 'undefined') {
            const parsedHtml = window.marked.parse(content);
            contentDiv.innerHTML = this.sanitizeHtml(parsedHtml);
        }
        else {
            const pre = document.createElement('pre');
            pre.textContent = content;
            contentDiv.appendChild(pre);
        }
        details.appendChild(summary);
        details.appendChild(contentDiv);
        li.appendChild(details);
        return li;
    }
    sanitizeHtml(html) {
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
        const allowedAttributes = {
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
    cleanElement(element, allowedTags, allowedAttributes, dangerousProtocols) {
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
                }
                else if (attrName === 'href' || attrName === 'src') {
                    // Enhanced security check for URLs
                    const value = attr.value.toLowerCase().trim();
                    const isDangerous = dangerousProtocols.some(protocol => value.startsWith(protocol) ||
                        value.includes('\t' + protocol) ||
                        value.includes('\n' + protocol) ||
                        value.includes('\r' + protocol) ||
                        value.includes(' ' + protocol));
                    if (isDangerous) {
                        child.removeAttribute(attr.name);
                    }
                }
            }
            // Recursively clean child elements
            this.cleanElement(child, allowedTags, allowedAttributes, dangerousProtocols);
        }
    }
    createErrorElement(name, error) {
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
    showNoReports() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('content').style.display = 'block';
        document.getElementById('no-reports').style.display = 'block';
        SDK.resize();
    }
    showError(message) {
        const errorDiv = document.getElementById('error');
        const loadingDiv = document.getElementById('loading');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        loadingDiv.style.display = 'none';
        // Auto-resize to fit content when showing error
        SDK.resize();
    }
}
// Initialize extension
document.addEventListener('DOMContentLoaded', () => {
    const extension = new BicepReportExtension();
    extension.initialize();
});
