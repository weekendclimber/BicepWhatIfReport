/**
 * Build Attachments Example - Azure DevOps Extension SDK v4
 * 
 * This example demonstrates how to work with build attachments using the SDK v4:
 * - Get build attachments by type
 * - Download attachment content
 * - Handle different attachment formats
 * - Filter and process attachments
 * - Error handling for attachment operations
 */

import * as SDK from 'azure-devops-extension-sdk';

interface IBuildService {
    getBuild(projectId: string, buildId: number): Promise<Build>;
    getBuildAttachments(projectId: string, buildId: number, type: string): Promise<BuildAttachment[]>;
    getAttachment(projectId: string, buildId: number, type: string, name: string): Promise<string>;
}

interface Build {
    id: number;
    buildNumber: string;
    status: string;
    result: string;
    startTime: Date;
    finishTime: Date;
}

interface BuildAttachment {
    name: string;
    type: string;
    _links?: {
        self: {
            href: string;
        };
    };
}

interface ProcessedAttachment {
    name: string;
    displayName: string;
    content: string;
    contentType: 'markdown' | 'json' | 'text' | 'binary';
    size: number;
    isError: boolean;
    errorMessage?: string;
}

class BuildAttachmentsManager {
    private buildService?: IBuildService;
    private projectId?: string;
    private buildId?: number;

    /**
     * Initialize the attachments manager
     */
    async initialize(): Promise<void> {
        try {
            // Initialize SDK
            await SDK.init();

            // Get build service
            this.buildService = await SDK.getService<IBuildService>('ms.vss-build-web.build-service');
            if (!this.buildService) {
                throw new Error('Build service not available');
            }

            // Get context information
            const webContext = SDK.getWebContext();
            const config = SDK.getConfiguration();

            if (!webContext.project) {
                throw new Error('Project context not available');
            }

            if (!config.buildId) {
                throw new Error('Build ID not available');
            }

            this.projectId = webContext.project.id;
            this.buildId = parseInt(config.buildId);

            console.log(`Initialized for project ${webContext.project.name}, build ${this.buildId}`);
        } catch (error) {
            console.error('Initialization failed:', error);
            throw error;
        }
    }

    /**
     * Get all attachments for the current build
     */
    async getAllBuildAttachments(): Promise<{ [type: string]: BuildAttachment[] }> {
        if (!this.buildService || !this.projectId || !this.buildId) {
            throw new Error('Manager not initialized');
        }

        try {
            // Get the build first to see what attachment types are available
            const build = await this.buildService.getBuild(this.projectId, this.buildId);
            console.log('Build information:', {
                id: build.id,
                buildNumber: build.buildNumber,
                status: build.status,
                result: build.result
            });

            // Common attachment types to check
            const attachmentTypes = [
                'bicepwhatifreport',
                'testresults',
                'codecoverage',
                'logs',
                'artifacts'
            ];

            const allAttachments: { [type: string]: BuildAttachment[] } = {};

            // Get attachments for each type
            for (const type of attachmentTypes) {
                try {
                    const attachments = await this.buildService.getBuildAttachments(
                        this.projectId,
                        this.buildId,
                        type
                    );

                    if (attachments && attachments.length > 0) {
                        allAttachments[type] = attachments;
                        console.log(`Found ${attachments.length} attachments of type '${type}'`);
                    }
                } catch (error) {
                    console.warn(`Failed to get attachments of type '${type}':`, error);
                }
            }

            return allAttachments;
        } catch (error) {
            console.error('Failed to get build attachments:', error);
            throw error;
        }
    }

    /**
     * Get attachments of a specific type
     */
    async getAttachmentsByType(type: string): Promise<BuildAttachment[]> {
        if (!this.buildService || !this.projectId || !this.buildId) {
            throw new Error('Manager not initialized');
        }

        try {
            const attachments = await this.buildService.getBuildAttachments(
                this.projectId,
                this.buildId,
                type
            );

            console.log(`Found ${attachments.length} attachments of type '${type}'`);
            return attachments || [];
        } catch (error) {
            console.error(`Failed to get attachments of type '${type}':`, error);
            throw error;
        }
    }

    /**
     * Download and process attachment content
     */
    async downloadAttachment(
        attachment: BuildAttachment, 
        type: string
    ): Promise<ProcessedAttachment> {
        if (!this.buildService || !this.projectId || !this.buildId) {
            throw new Error('Manager not initialized');
        }

        try {
            console.log(`Downloading attachment: ${attachment.name}`);
            
            const content = await this.buildService.getAttachment(
                this.projectId,
                this.buildId,
                type,
                attachment.name
            );

            return this.processAttachmentContent(attachment, content);
        } catch (error) {
            console.error(`Failed to download attachment '${attachment.name}':`, error);
            
            return {
                name: attachment.name,
                displayName: this.getDisplayName(attachment.name),
                content: '',
                contentType: 'text',
                size: 0,
                isError: true,
                errorMessage: error.message
            };
        }
    }

    /**
     * Process attachment content and determine its type
     */
    private processAttachmentContent(
        attachment: BuildAttachment, 
        content: string
    ): ProcessedAttachment {
        const name = attachment.name;
        const displayName = this.getDisplayName(name);
        const size = content.length;

        // Determine content type based on file extension and content
        let contentType: ProcessedAttachment['contentType'] = 'text';
        
        if (name.toLowerCase().endsWith('.md') || name.includes('md/')) {
            contentType = 'markdown';
        } else if (name.toLowerCase().endsWith('.json')) {
            contentType = 'json';
            
            // Validate JSON content
            try {
                JSON.parse(content);
            } catch {
                console.warn(`Invalid JSON content in ${name}`);
            }
        } else if (this.isBinaryContent(content)) {
            contentType = 'binary';
        }

        return {
            name,
            displayName,
            content,
            contentType,
            size,
            isError: false
        };
    }

    /**
     * Get a clean display name for an attachment
     */
    private getDisplayName(name: string): string {
        return name
            .replace('md/', '')              // Remove md/ prefix
            .replace(/\^[0-9]+/g, '')       // Remove escape sequences
            .replace(/[_-]/g, ' ')          // Replace underscores and dashes with spaces
            .replace(/\.(md|json|txt)$/i, '') // Remove common extensions
            .trim();
    }

    /**
     * Check if content appears to be binary
     */
    private isBinaryContent(content: string): boolean {
        // Simple heuristic: if content contains many null bytes or non-printable characters
        const nullBytes = (content.match(/\0/g) || []).length;
        const nonPrintable = (content.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g) || []).length;
        
        return nullBytes > 0 || (nonPrintable / content.length) > 0.1;
    }

    /**
     * Download all attachments of a specific type
     */
    async downloadAllAttachments(type: string): Promise<ProcessedAttachment[]> {
        try {
            const attachments = await this.getAttachmentsByType(type);
            const processedAttachments: ProcessedAttachment[] = [];

            console.log(`Downloading ${attachments.length} attachments of type '${type}'`);

            // Download attachments in parallel with concurrency limit
            const concurrency = 3;
            for (let i = 0; i < attachments.length; i += concurrency) {
                const batch = attachments.slice(i, i + concurrency);
                const batchResults = await Promise.all(
                    batch.map(attachment => this.downloadAttachment(attachment, type))
                );
                processedAttachments.push(...batchResults);
            }

            const successCount = processedAttachments.filter(a => !a.isError).length;
            const errorCount = processedAttachments.filter(a => a.isError).length;
            
            console.log(`Download completed: ${successCount} successful, ${errorCount} failed`);
            
            return processedAttachments;
        } catch (error) {
            console.error(`Failed to download attachments of type '${type}':`, error);
            throw error;
        }
    }

    /**
     * Filter attachments by criteria
     */
    filterAttachments(
        attachments: ProcessedAttachment[],
        criteria: {
            contentType?: ProcessedAttachment['contentType'];
            minSize?: number;
            maxSize?: number;
            namePattern?: RegExp;
            excludeErrors?: boolean;
        }
    ): ProcessedAttachment[] {
        return attachments.filter(attachment => {
            // Filter by content type
            if (criteria.contentType && attachment.contentType !== criteria.contentType) {
                return false;
            }

            // Filter by size
            if (criteria.minSize && attachment.size < criteria.minSize) {
                return false;
            }
            
            if (criteria.maxSize && attachment.size > criteria.maxSize) {
                return false;
            }

            // Filter by name pattern
            if (criteria.namePattern && !criteria.namePattern.test(attachment.name)) {
                return false;
            }

            // Filter out errors
            if (criteria.excludeErrors && attachment.isError) {
                return false;
            }

            return true;
        });
    }

    /**
     * Get summary statistics for attachments
     */
    getAttachmentsSummary(attachments: ProcessedAttachment[]): {
        total: number;
        byType: { [type: string]: number };
        totalSize: number;
        errors: number;
        largest: ProcessedAttachment | null;
    } {
        const summary = {
            total: attachments.length,
            byType: {} as { [type: string]: number },
            totalSize: 0,
            errors: 0,
            largest: null as ProcessedAttachment | null
        };

        attachments.forEach(attachment => {
            // Count by type
            summary.byType[attachment.contentType] = (summary.byType[attachment.contentType] || 0) + 1;
            
            // Sum total size
            summary.totalSize += attachment.size;
            
            // Count errors
            if (attachment.isError) {
                summary.errors++;
            }
            
            // Track largest
            if (!summary.largest || attachment.size > summary.largest.size) {
                summary.largest = attachment;
            }
        });

        return summary;
    }

    /**
     * Export attachments as JSON for further processing
     */
    exportAttachmentsAsJson(attachments: ProcessedAttachment[]): string {
        const exportData = {
            exportTimestamp: new Date().toISOString(),
            projectId: this.projectId,
            buildId: this.buildId,
            summary: this.getAttachmentsSummary(attachments),
            attachments: attachments.map(attachment => ({
                name: attachment.name,
                displayName: attachment.displayName,
                contentType: attachment.contentType,
                size: attachment.size,
                isError: attachment.isError,
                errorMessage: attachment.errorMessage,
                // Only include content for small text files
                content: attachment.size < 10000 && !attachment.isError ? attachment.content : '[Content omitted - too large]'
            }))
        };

        return JSON.stringify(exportData, null, 2);
    }
}

// Example usage function
async function demonstrateBuildAttachments(): Promise<void> {
    try {
        const manager = new BuildAttachmentsManager();
        await manager.initialize();

        // Get all attachments
        console.log('\n=== Getting all build attachments ===');
        const allAttachments = await manager.getAllBuildAttachments();
        
        for (const [type, attachments] of Object.entries(allAttachments)) {
            console.log(`\nType: ${type}`);
            attachments.forEach(att => console.log(`  - ${att.name}`));
        }

        // Focus on Bicep What-If reports
        console.log('\n=== Processing Bicep What-If Reports ===');
        const bicepReports = await manager.downloadAllAttachments('bicepwhatifreport');
        
        // Filter for markdown reports
        const markdownReports = manager.filterAttachments(bicepReports, {
            contentType: 'markdown',
            excludeErrors: true
        });

        console.log(`Found ${markdownReports.length} markdown reports`);
        
        // Get summary
        const summary = manager.getAttachmentsSummary(bicepReports);
        console.log('Summary:', summary);

        // Export data
        const exportJson = manager.exportAttachmentsAsJson(bicepReports);
        console.log('\nExported data length:', exportJson.length);

    } catch (error) {
        console.error('Demonstration failed:', error);
    }
}

// Export the manager class
export { BuildAttachmentsManager, demonstrateBuildAttachments };