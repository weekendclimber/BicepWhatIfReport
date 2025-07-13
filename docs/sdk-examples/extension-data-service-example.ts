/**
 * Extension Data Service Example - Azure DevOps Extension SDK v4
 * 
 * This example demonstrates how to use the Extension Data Service for:
 * - Storing and retrieving user settings/preferences
 * - Managing extension state across sessions
 * - Document storage and retrieval
 * - Scoped data storage (user vs global)
 * - Error handling and data validation
 */

import * as SDK from 'azure-devops-extension-sdk';

interface IExtensionDataService {
    getValue<T>(key: string, defaultValue?: T): Promise<T>;
    setValue<T>(key: string, value: T): Promise<T>;
    getDocument(collectionName: string, id: string): Promise<any>;
    setDocument(collectionName: string, doc: any): Promise<any>;
    deleteDocument(collectionName: string, id: string): Promise<void>;
    getDocuments(collectionName: string): Promise<any[]>;
}

// Define types for our extension data
interface UserPreferences {
    theme: 'light' | 'dark' | 'auto';
    autoRefresh: boolean;
    refreshInterval: number;
    defaultView: 'summary' | 'detailed';
    notifications: {
        enabled: boolean;
        types: string[];
    };
}

interface ReportMetadata {
    id: string;
    name: string;
    buildId: number;
    projectId: string;
    createdDate: string;
    tags: string[];
    isFavorite: boolean;
}

interface ExtensionState {
    lastViewedBuild: number;
    collapsedSections: string[];
    columnWidths: { [column: string]: number };
    sortBy: string;
    sortDirection: 'asc' | 'desc';
}

class ExtensionDataManager {
    private dataService?: IExtensionDataService;
    private isInitialized = false;

    // Collection names for different data types
    private readonly COLLECTIONS = {
        REPORTS: 'bicep-reports',
        USER_DATA: 'user-data',
        SETTINGS: 'settings'
    };

    // Keys for simple key-value storage
    private readonly KEYS = {
        USER_PREFERENCES: 'user-preferences',
        EXTENSION_STATE: 'extension-state',
        LAST_SYNC: 'last-sync'
    };

    /**
     * Initialize the data manager
     */
    async initialize(): Promise<void> {
        try {
            if (this.isInitialized) {
                return;
            }

            // Initialize SDK
            await SDK.init();

            // Get extension data service
            this.dataService = await SDK.getService<IExtensionDataService>('ms.vss-features.extension-data-service');
            if (!this.dataService) {
                throw new Error('Extension data service not available');
            }

            this.isInitialized = true;
            console.log('Extension data manager initialized');
        } catch (error) {
            console.error('Failed to initialize extension data manager:', error);
            throw error;
        }
    }

    /**
     * Ensure the manager is initialized
     */
    private ensureInitialized(): void {
        if (!this.isInitialized || !this.dataService) {
            throw new Error('Extension data manager not initialized');
        }
    }

    // ============================================================================
    // USER PREFERENCES MANAGEMENT
    // ============================================================================

    /**
     * Get user preferences with defaults
     */
    async getUserPreferences(): Promise<UserPreferences> {
        this.ensureInitialized();

        try {
            const defaultPreferences: UserPreferences = {
                theme: 'auto',
                autoRefresh: false,
                refreshInterval: 30,
                defaultView: 'summary',
                notifications: {
                    enabled: true,
                    types: ['error', 'warning']
                }
            };

            const preferences = await this.dataService!.getValue(
                this.KEYS.USER_PREFERENCES, 
                defaultPreferences
            );

            console.log('User preferences loaded:', preferences);
            return preferences;
        } catch (error) {
            console.error('Failed to load user preferences:', error);
            throw error;
        }
    }

    /**
     * Save user preferences
     */
    async saveUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
        this.ensureInitialized();

        try {
            // Get current preferences and merge with new ones
            const currentPreferences = await this.getUserPreferences();
            const updatedPreferences = this.mergePreferences(currentPreferences, preferences);

            // Validate preferences
            this.validateUserPreferences(updatedPreferences);

            await this.dataService!.setValue(this.KEYS.USER_PREFERENCES, updatedPreferences);
            console.log('User preferences saved:', updatedPreferences);
        } catch (error) {
            console.error('Failed to save user preferences:', error);
            throw error;
        }
    }

    /**
     * Merge preferences objects deeply
     */
    private mergePreferences(
        current: UserPreferences, 
        updates: Partial<UserPreferences>
    ): UserPreferences {
        return {
            ...current,
            ...updates,
            notifications: {
                ...current.notifications,
                ...(updates.notifications || {})
            }
        };
    }

    /**
     * Validate user preferences
     */
    private validateUserPreferences(preferences: UserPreferences): void {
        if (!['light', 'dark', 'auto'].includes(preferences.theme)) {
            throw new Error('Invalid theme preference');
        }

        if (preferences.refreshInterval < 5 || preferences.refreshInterval > 300) {
            throw new Error('Refresh interval must be between 5 and 300 seconds');
        }

        if (!['summary', 'detailed'].includes(preferences.defaultView)) {
            throw new Error('Invalid default view preference');
        }
    }

    // ============================================================================
    // EXTENSION STATE MANAGEMENT
    // ============================================================================

    /**
     * Get extension state
     */
    async getExtensionState(): Promise<ExtensionState> {
        this.ensureInitialized();

        try {
            const defaultState: ExtensionState = {
                lastViewedBuild: 0,
                collapsedSections: [],
                columnWidths: {},
                sortBy: 'name',
                sortDirection: 'asc'
            };

            const state = await this.dataService!.getValue(this.KEYS.EXTENSION_STATE, defaultState);
            console.log('Extension state loaded:', state);
            return state;
        } catch (error) {
            console.error('Failed to load extension state:', error);
            throw error;
        }
    }

    /**
     * Save extension state
     */
    async saveExtensionState(state: Partial<ExtensionState>): Promise<void> {
        this.ensureInitialized();

        try {
            const currentState = await this.getExtensionState();
            const updatedState = { ...currentState, ...state };

            await this.dataService!.setValue(this.KEYS.EXTENSION_STATE, updatedState);
            console.log('Extension state saved:', updatedState);
        } catch (error) {
            console.error('Failed to save extension state:', error);
            throw error;
        }
    }

    // ============================================================================
    // DOCUMENT STORAGE (REPORTS METADATA)
    // ============================================================================

    /**
     * Save report metadata
     */
    async saveReportMetadata(metadata: ReportMetadata): Promise<void> {
        this.ensureInitialized();

        try {
            // Validate metadata
            this.validateReportMetadata(metadata);

            const document = {
                id: metadata.id,
                ...metadata,
                lastUpdated: new Date().toISOString()
            };

            await this.dataService!.setDocument(this.COLLECTIONS.REPORTS, document);
            console.log('Report metadata saved:', document.id);
        } catch (error) {
            console.error('Failed to save report metadata:', error);
            throw error;
        }
    }

    /**
     * Get report metadata by ID
     */
    async getReportMetadata(reportId: string): Promise<ReportMetadata | null> {
        this.ensureInitialized();

        try {
            const document = await this.dataService!.getDocument(this.COLLECTIONS.REPORTS, reportId);
            if (!document) {
                return null;
            }

            console.log('Report metadata loaded:', reportId);
            return document as ReportMetadata;
        } catch (error) {
            console.error(`Failed to load report metadata for ${reportId}:`, error);
            return null;
        }
    }

    /**
     * Get all report metadata
     */
    async getAllReportMetadata(): Promise<ReportMetadata[]> {
        this.ensureInitialized();

        try {
            const documents = await this.dataService!.getDocuments(this.COLLECTIONS.REPORTS);
            console.log(`Loaded ${documents.length} report metadata documents`);
            return documents as ReportMetadata[];
        } catch (error) {
            console.error('Failed to load all report metadata:', error);
            throw error;
        }
    }

    /**
     * Delete report metadata
     */
    async deleteReportMetadata(reportId: string): Promise<void> {
        this.ensureInitialized();

        try {
            await this.dataService!.deleteDocument(this.COLLECTIONS.REPORTS, reportId);
            console.log('Report metadata deleted:', reportId);
        } catch (error) {
            console.error(`Failed to delete report metadata for ${reportId}:`, error);
            throw error;
        }
    }

    /**
     * Validate report metadata
     */
    private validateReportMetadata(metadata: ReportMetadata): void {
        if (!metadata.id || typeof metadata.id !== 'string') {
            throw new Error('Report metadata must have a valid ID');
        }

        if (!metadata.name || typeof metadata.name !== 'string') {
            throw new Error('Report metadata must have a valid name');
        }

        if (!metadata.buildId || typeof metadata.buildId !== 'number') {
            throw new Error('Report metadata must have a valid build ID');
        }

        if (!metadata.projectId || typeof metadata.projectId !== 'string') {
            throw new Error('Report metadata must have a valid project ID');
        }
    }

    // ============================================================================
    // SEARCH AND FILTERING
    // ============================================================================

    /**
     * Search reports by criteria
     */
    async searchReports(criteria: {
        name?: string;
        projectId?: string;
        buildId?: number;
        tags?: string[];
        isFavorite?: boolean;
        dateRange?: { start: string; end: string };
    }): Promise<ReportMetadata[]> {
        try {
            const allReports = await this.getAllReportMetadata();
            
            return allReports.filter(report => {
                // Filter by name
                if (criteria.name && !report.name.toLowerCase().includes(criteria.name.toLowerCase())) {
                    return false;
                }

                // Filter by project
                if (criteria.projectId && report.projectId !== criteria.projectId) {
                    return false;
                }

                // Filter by build
                if (criteria.buildId && report.buildId !== criteria.buildId) {
                    return false;
                }

                // Filter by tags
                if (criteria.tags && criteria.tags.length > 0) {
                    const hasAllTags = criteria.tags.every(tag => report.tags.includes(tag));
                    if (!hasAllTags) {
                        return false;
                    }
                }

                // Filter by favorite status
                if (criteria.isFavorite !== undefined && report.isFavorite !== criteria.isFavorite) {
                    return false;
                }

                // Filter by date range
                if (criteria.dateRange) {
                    const reportDate = new Date(report.createdDate);
                    const startDate = new Date(criteria.dateRange.start);
                    const endDate = new Date(criteria.dateRange.end);
                    
                    if (reportDate < startDate || reportDate > endDate) {
                        return false;
                    }
                }

                return true;
            });
        } catch (error) {
            console.error('Failed to search reports:', error);
            throw error;
        }
    }

    /**
     * Get favorite reports
     */
    async getFavoriteReports(): Promise<ReportMetadata[]> {
        return this.searchReports({ isFavorite: true });
    }

    /**
     * Get recent reports
     */
    async getRecentReports(limit: number = 10): Promise<ReportMetadata[]> {
        try {
            const allReports = await this.getAllReportMetadata();
            
            // Sort by creation date (newest first) and limit
            return allReports
                .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
                .slice(0, limit);
        } catch (error) {
            console.error('Failed to get recent reports:', error);
            throw error;
        }
    }

    // ============================================================================
    // DATA MANAGEMENT UTILITIES
    // ============================================================================

    /**
     * Clear all extension data (for debugging/reset)
     */
    async clearAllData(): Promise<void> {
        this.ensureInitialized();

        try {
            // Clear simple key-value pairs
            await this.dataService!.setValue(this.KEYS.USER_PREFERENCES, null);
            await this.dataService!.setValue(this.KEYS.EXTENSION_STATE, null);
            await this.dataService!.setValue(this.KEYS.LAST_SYNC, null);

            // Clear document collections
            const reports = await this.getAllReportMetadata();
            for (const report of reports) {
                await this.deleteReportMetadata(report.id);
            }

            console.log('All extension data cleared');
        } catch (error) {
            console.error('Failed to clear extension data:', error);
            throw error;
        }
    }

    /**
     * Export all extension data
     */
    async exportAllData(): Promise<string> {
        this.ensureInitialized();

        try {
            const exportData = {
                exportTimestamp: new Date().toISOString(),
                userPreferences: await this.getUserPreferences(),
                extensionState: await this.getExtensionState(),
                reports: await this.getAllReportMetadata()
            };

            return JSON.stringify(exportData, null, 2);
        } catch (error) {
            console.error('Failed to export extension data:', error);
            throw error;
        }
    }

    /**
     * Get data storage statistics
     */
    async getStorageStatistics(): Promise<{
        keyValuePairs: number;
        reportDocuments: number;
        estimatedSize: number;
    }> {
        try {
            const reports = await this.getAllReportMetadata();
            const exportData = await this.exportAllData();
            
            return {
                keyValuePairs: 3, // USER_PREFERENCES, EXTENSION_STATE, LAST_SYNC
                reportDocuments: reports.length,
                estimatedSize: exportData.length
            };
        } catch (error) {
            console.error('Failed to get storage statistics:', error);
            throw error;
        }
    }

    /**
     * Update last sync timestamp
     */
    async updateLastSync(): Promise<void> {
        this.ensureInitialized();

        try {
            const timestamp = new Date().toISOString();
            await this.dataService!.setValue(this.KEYS.LAST_SYNC, timestamp);
            console.log('Last sync timestamp updated:', timestamp);
        } catch (error) {
            console.error('Failed to update last sync timestamp:', error);
            throw error;
        }
    }

    /**
     * Get last sync timestamp
     */
    async getLastSync(): Promise<string | null> {
        this.ensureInitialized();

        try {
            const timestamp = await this.dataService!.getValue<string>(this.KEYS.LAST_SYNC, null);
            return timestamp;
        } catch (error) {
            console.error('Failed to get last sync timestamp:', error);
            return null;
        }
    }
}

// Example usage function
async function demonstrateExtensionDataService(): Promise<void> {
    try {
        const dataManager = new ExtensionDataManager();
        await dataManager.initialize();

        console.log('\n=== User Preferences Demo ===');
        
        // Load preferences
        let preferences = await dataManager.getUserPreferences();
        console.log('Current preferences:', preferences);

        // Update preferences
        await dataManager.saveUserPreferences({
            theme: 'dark',
            autoRefresh: true,
            refreshInterval: 60
        });

        // Load updated preferences
        preferences = await dataManager.getUserPreferences();
        console.log('Updated preferences:', preferences);

        console.log('\n=== Report Metadata Demo ===');

        // Save report metadata
        const reportMetadata: ReportMetadata = {
            id: 'report-123',
            name: 'Storage Account Changes',
            buildId: 456,
            projectId: 'my-project',
            createdDate: new Date().toISOString(),
            tags: ['storage', 'bicep'],
            isFavorite: true
        };

        await dataManager.saveReportMetadata(reportMetadata);

        // Search reports
        const favoriteReports = await dataManager.getFavoriteReports();
        console.log('Favorite reports:', favoriteReports);

        // Get storage statistics
        const stats = await dataManager.getStorageStatistics();
        console.log('Storage statistics:', stats);

    } catch (error) {
        console.error('Demonstration failed:', error);
    }
}

// Export the manager class
export { ExtensionDataManager, demonstrateExtensionDataService };