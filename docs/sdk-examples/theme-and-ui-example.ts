/**
 * Theme and UI Integration Example - Azure DevOps Extension SDK v4
 * 
 * This example demonstrates how to:
 * - Apply Azure DevOps themes automatically
 * - Handle theme changes dynamically
 * - Manage UI resizing
 * - Integrate with Azure DevOps UI patterns
 * - Handle responsive design
 */

import * as SDK from 'azure-devops-extension-sdk';

interface ThemeVariables {
    [varName: string]: string;
}

interface UISettings {
    containerWidth: number;
    containerHeight: number;
    autoResize: boolean;
    responsive: boolean;
}

class ThemeAndUIManager {
    private currentTheme: 'light' | 'dark' | 'auto' = 'auto';
    private themeObserver?: MutationObserver;
    private resizeObserver?: ResizeObserver;
    private uiSettings: UISettings = {
        containerWidth: 800,
        containerHeight: 600,
        autoResize: true,
        responsive: true
    };

    /**
     * Initialize theme and UI management
     */
    async initialize(): Promise<void> {
        try {
            // Initialize SDK with theme application enabled
            await SDK.init({ 
                loaded: false,
                applyTheme: true 
            });

            // Setup initial theme
            await this.setupTheme();

            // Setup UI management
            this.setupUIManagement();

            // Create sample UI to demonstrate theming
            this.createSampleUI();

            // Setup theme change detection
            this.setupThemeChangeDetection();

            // Setup auto-resize
            this.setupAutoResize();

            await SDK.notifyLoadSucceeded();
            console.log('Theme and UI manager initialized');
        } catch (error) {
            console.error('Failed to initialize theme and UI manager:', error);
            await SDK.notifyLoadFailed(error);
        }
    }

    /**
     * Setup theme application using SDK v4
     */
    private async setupTheme(): Promise<void> {
        try {
            // Get page context for theme information
            const pageContext = SDK.getPageContext();
            const globalization = pageContext.globalization;
            
            console.log('Theme information:', {
                theme: globalization.theme,
                explicitTheme: globalization.explicitTheme,
                culture: globalization.culture
            });

            // Determine current theme
            this.currentTheme = this.determineTheme(globalization.theme, globalization.explicitTheme);
            
            // Apply theme variables
            this.applyThemeVariables();

            console.log('Theme setup completed:', this.currentTheme);
        } catch (error) {
            console.error('Theme setup failed:', error);
            throw error;
        }
    }

    /**
     * Determine the current theme based on Azure DevOps settings
     */
    private determineTheme(theme: string, explicitTheme: string): 'light' | 'dark' | 'auto' {
        // If there's an explicit theme set, use it
        if (explicitTheme && explicitTheme !== '') {
            return explicitTheme.includes('dark') ? 'dark' : 'light';
        }

        // Otherwise use the theme setting
        if (theme.includes('dark')) {
            return 'dark';
        } else if (theme.includes('light')) {
            return 'light';
        }

        return 'auto';
    }

    /**
     * Apply theme variables using SDK
     */
    private applyThemeVariables(): void {
        const themeVariables = this.getThemeVariables(this.currentTheme);
        
        // Apply theme using SDK method
        SDK.applyTheme(themeVariables);

        // Also apply to CSS custom properties for more advanced theming
        const root = document.documentElement;
        Object.entries(themeVariables).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        // Update body class for CSS targeting
        document.body.className = `theme-${this.currentTheme}`;
    }

    /**
     * Get theme variables for the specified theme
     */
    private getThemeVariables(theme: 'light' | 'dark' | 'auto'): ThemeVariables {
        const baseVariables = {
            '--font-family': 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
            '--border-radius': '4px',
            '--spacing-xs': '4px',
            '--spacing-sm': '8px',
            '--spacing-md': '12px',
            '--spacing-lg': '16px',
            '--spacing-xl': '24px'
        };

        if (theme === 'dark') {
            return {
                ...baseVariables,
                '--primary-color': '#0078d4',
                '--primary-hover': '#106ebe',
                '--background-color': '#1f1f1f',
                '--surface-color': '#2d2d30',
                '--text-color': '#ffffff',
                '--text-secondary': '#cccccc',
                '--border-color': '#404040',
                '--border-light': '#2d2d30',
                '--success-color': '#107c10',
                '--warning-color': '#ff8c00',
                '--error-color': '#d13438',
                '--info-color': '#0078d4',
                '--shadow': '0 2px 8px rgba(0, 0, 0, 0.5)'
            };
        } else {
            return {
                ...baseVariables,
                '--primary-color': '#0078d4',
                '--primary-hover': '#106ebe',
                '--background-color': '#ffffff',
                '--surface-color': '#f8f9fa',
                '--text-color': '#323130',
                '--text-secondary': '#605e5c',
                '--border-color': '#e1e8ed',
                '--border-light': '#f3f2f1',
                '--success-color': '#107c10',
                '--warning-color': '#ff8c00',
                '--error-color': '#d13438',
                '--info-color': '#0078d4',
                '--shadow': '0 2px 8px rgba(0, 0, 0, 0.1)'
            };
        }
    }

    /**
     * Setup UI management
     */
    private setupUIManagement(): void {
        // Create styles for the extension
        this.createUIStyles();

        // Setup responsive design
        if (this.uiSettings.responsive) {
            this.setupResponsiveDesign();
        }
    }

    /**
     * Create CSS styles for the extension
     */
    private createUIStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            /* Base styles using theme variables */
            .extension-container {
                font-family: var(--font-family);
                background-color: var(--background-color);
                color: var(--text-color);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                overflow: hidden;
                box-shadow: var(--shadow);
                max-width: 100%;
                margin: 0 auto;
            }

            .extension-header {
                background-color: var(--primary-color);
                color: white;
                padding: var(--spacing-lg);
                border-bottom: 1px solid var(--border-color);
            }

            .extension-header h1 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
            }

            .extension-content {
                padding: var(--spacing-lg);
            }

            .card {
                background-color: var(--surface-color);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                padding: var(--spacing-md);
                margin-bottom: var(--spacing-md);
            }

            .button {
                background-color: var(--primary-color);
                color: white;
                border: none;
                padding: var(--spacing-sm) var(--spacing-md);
                border-radius: var(--border-radius);
                cursor: pointer;
                font-family: var(--font-family);
                transition: background-color 0.2s;
            }

            .button:hover {
                background-color: var(--primary-hover);
            }

            .button-secondary {
                background-color: var(--surface-color);
                color: var(--text-color);
                border: 1px solid var(--border-color);
            }

            .button-secondary:hover {
                background-color: var(--border-light);
            }

            .status-success {
                color: var(--success-color);
            }

            .status-warning {
                color: var(--warning-color);
            }

            .status-error {
                color: var(--error-color);
            }

            .status-info {
                color: var(--info-color);
            }

            /* Responsive design */
            @media (max-width: 768px) {
                .extension-container {
                    margin: 0;
                    border-radius: 0;
                    border-left: none;
                    border-right: none;
                }

                .extension-content {
                    padding: var(--spacing-md);
                }

                .card {
                    margin-bottom: var(--spacing-sm);
                    padding: var(--spacing-sm);
                }
            }

            /* Animation for theme transitions */
            .extension-container * {
                transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Create sample UI to demonstrate theming
     */
    private createSampleUI(): void {
        const container = document.createElement('div');
        container.className = 'extension-container';
        container.innerHTML = `
            <div class="extension-header">
                <h1>Bicep What-If Report - Theme Demo</h1>
            </div>
            <div class="extension-content">
                <div class="card">
                    <h3>Theme Information</h3>
                    <p>Current theme: <span id="current-theme">${this.currentTheme}</span></p>
                    <p>Applied at: <span id="theme-time">${new Date().toLocaleTimeString()}</span></p>
                </div>

                <div class="card">
                    <h3>Theme Controls</h3>
                    <button class="button" onclick="window.themeManager.switchTheme('light')">Light Theme</button>
                    <button class="button" onclick="window.themeManager.switchTheme('dark')">Dark Theme</button>
                    <button class="button button-secondary" onclick="window.themeManager.switchTheme('auto')">Auto Theme</button>
                </div>

                <div class="card">
                    <h3>Status Examples</h3>
                    <p class="status-success">✓ Success: Operation completed successfully</p>
                    <p class="status-warning">⚠ Warning: Please review the changes</p>
                    <p class="status-error">✗ Error: Operation failed</p>
                    <p class="status-info">ℹ Info: Additional information available</p>
                </div>

                <div class="card">
                    <h3>UI Controls</h3>
                    <button class="button" onclick="window.themeManager.resizeToContent()">Resize to Content</button>
                    <button class="button button-secondary" onclick="window.themeManager.resizeToSize(1000, 800)">Resize Large</button>
                    <button class="button button-secondary" onclick="window.themeManager.resizeToSize(600, 400)">Resize Small</button>
                </div>

                <div class="card">
                    <h3>Responsive Test</h3>
                    <p>Resize the window or change the extension size to see responsive behavior.</p>
                    <div id="viewport-info"></div>
                </div>
            </div>
        `;

        document.body.appendChild(container);

        // Expose methods for demo buttons
        (window as any).themeManager = this;

        // Update viewport info
        this.updateViewportInfo();
    }

    /**
     * Setup theme change detection
     */
    private setupThemeChangeDetection(): void {
        // Watch for theme changes in the parent document
        if (window.parent && window.parent.document) {
            this.themeObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && 
                        (mutation.attributeName === 'class' || mutation.attributeName === 'data-theme')) {
                        this.handleThemeChange();
                    }
                });
            });

            this.themeObserver.observe(window.parent.document.documentElement, {
                attributes: true,
                attributeFilter: ['class', 'data-theme']
            });
        }

        // Also watch for changes in our own document
        const localObserver = new MutationObserver(() => {
            this.updateViewportInfo();
        });

        localObserver.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true
        });
    }

    /**
     * Handle theme changes
     */
    private async handleThemeChange(): Promise<void> {
        try {
            console.log('Theme change detected, updating...');
            
            // Re-get page context for updated theme info
            const pageContext = SDK.getPageContext();
            const newTheme = this.determineTheme(
                pageContext.globalization.theme, 
                pageContext.globalization.explicitTheme
            );

            if (newTheme !== this.currentTheme) {
                this.currentTheme = newTheme;
                this.applyThemeVariables();
                
                // Update UI
                const themeElement = document.getElementById('current-theme');
                const timeElement = document.getElementById('theme-time');
                
                if (themeElement) themeElement.textContent = this.currentTheme;
                if (timeElement) timeElement.textContent = new Date().toLocaleTimeString();
                
                console.log('Theme updated to:', this.currentTheme);
            }
        } catch (error) {
            console.error('Failed to handle theme change:', error);
        }
    }

    /**
     * Setup auto-resize functionality
     */
    private setupAutoResize(): void {
        if (this.uiSettings.autoResize) {
            // Resize on content changes
            if (window.ResizeObserver) {
                this.resizeObserver = new ResizeObserver(() => {
                    this.resizeToContent();
                });

                this.resizeObserver.observe(document.body);
            }

            // Resize on window resize
            window.addEventListener('resize', () => {
                this.resizeToContent();
            });

            // Initial resize
            setTimeout(() => this.resizeToContent(), 100);
        }
    }

    /**
     * Setup responsive design
     */
    private setupResponsiveDesign(): void {
        // Add viewport meta tag if not present
        if (!document.querySelector('meta[name="viewport"]')) {
            const viewport = document.createElement('meta');
            viewport.name = 'viewport';
            viewport.content = 'width=device-width, initial-scale=1.0';
            document.head.appendChild(viewport);
        }

        // Add responsive breakpoint detection
        window.addEventListener('resize', () => {
            this.updateViewportInfo();
            this.handleResponsiveChanges();
        });
    }

    /**
     * Handle responsive design changes
     */
    private handleResponsiveChanges(): void {
        const width = window.innerWidth;
        const container = document.querySelector('.extension-container') as HTMLElement;
        
        if (container) {
            // Add responsive classes
            container.classList.toggle('mobile', width < 768);
            container.classList.toggle('tablet', width >= 768 && width < 1024);
            container.classList.toggle('desktop', width >= 1024);
        }

        // Auto-resize if enabled
        if (this.uiSettings.autoResize) {
            this.resizeToContent();
        }
    }

    /**
     * Update viewport information display
     */
    private updateViewportInfo(): void {
        const viewportInfo = document.getElementById('viewport-info');
        if (viewportInfo) {
            viewportInfo.innerHTML = `
                <small>
                    Viewport: ${window.innerWidth} × ${window.innerHeight}<br>
                    Body: ${document.body.scrollWidth} × ${document.body.scrollHeight}<br>
                    Device Pixel Ratio: ${window.devicePixelRatio}
                </small>
            `;
        }
    }

    // ============================================================================
    // PUBLIC METHODS (for demo buttons and external use)
    // ============================================================================

    /**
     * Switch to a specific theme
     */
    async switchTheme(theme: 'light' | 'dark' | 'auto'): Promise<void> {
        try {
            this.currentTheme = theme;
            this.applyThemeVariables();
            
            // Update UI
            const themeElement = document.getElementById('current-theme');
            const timeElement = document.getElementById('theme-time');
            
            if (themeElement) themeElement.textContent = this.currentTheme;
            if (timeElement) timeElement.textContent = new Date().toLocaleTimeString();
            
            console.log('Theme manually switched to:', theme);
        } catch (error) {
            console.error('Failed to switch theme:', error);
        }
    }

    /**
     * Resize extension to fit content
     */
    resizeToContent(): void {
        try {
            const body = document.body;
            const width = Math.min(body.scrollWidth, 1200); // Max width 1200px
            const height = Math.min(body.scrollHeight, 800); // Max height 800px
            
            SDK.resize(width, height);
            console.log(`Resized to content: ${width} × ${height}`);
        } catch (error) {
            console.error('Failed to resize to content:', error);
        }
    }

    /**
     * Resize extension to specific dimensions
     */
    resizeToSize(width: number, height: number): void {
        try {
            SDK.resize(width, height);
            this.uiSettings.containerWidth = width;
            this.uiSettings.containerHeight = height;
            
            console.log(`Resized to: ${width} × ${height}`);
        } catch (error) {
            console.error('Failed to resize to size:', error);
        }
    }

    /**
     * Toggle auto-resize
     */
    toggleAutoResize(): void {
        this.uiSettings.autoResize = !this.uiSettings.autoResize;
        
        if (this.uiSettings.autoResize) {
            this.setupAutoResize();
        } else if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        
        console.log('Auto-resize:', this.uiSettings.autoResize);
    }

    /**
     * Get current theme information
     */
    getThemeInfo(): {
        currentTheme: string;
        appliedVariables: ThemeVariables;
        uiSettings: UISettings;
    } {
        return {
            currentTheme: this.currentTheme,
            appliedVariables: this.getThemeVariables(this.currentTheme),
            uiSettings: { ...this.uiSettings }
        };
    }

    /**
     * Cleanup resources
     */
    cleanup(): void {
        if (this.themeObserver) {
            this.themeObserver.disconnect();
        }
        
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        
        console.log('Theme and UI manager cleaned up');
    }
}

// Example usage function
async function demonstrateThemeAndUI(): Promise<void> {
    try {
        const manager = new ThemeAndUIManager();
        await manager.initialize();

        console.log('Theme and UI demonstration ready');
        console.log('Current theme info:', manager.getThemeInfo());

        // Demonstrate programmatic theme switching after 5 seconds
        setTimeout(() => {
            console.log('Demonstrating programmatic theme switch...');
            const currentInfo = manager.getThemeInfo();
            const newTheme = currentInfo.currentTheme === 'light' ? 'dark' : 'light';
            manager.switchTheme(newTheme as any);
        }, 5000);

    } catch (error) {
        console.error('Theme and UI demonstration failed:', error);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    demonstrateThemeAndUI();
});

// Export the manager class
export { ThemeAndUIManager, demonstrateThemeAndUI };