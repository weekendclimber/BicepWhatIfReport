/**
 * Error Handling Patterns - Azure DevOps Extension SDK v4
 * 
 * This example demonstrates comprehensive error handling patterns for:
 * - SDK initialization errors
 * - Service access failures
 * - Network and API errors
 * - Context availability issues
 * - Graceful degradation strategies
 * - User-friendly error reporting
 * - Retry mechanisms
 * - Error recovery patterns
 */

import * as SDK from 'azure-devops-extension-sdk';

// Custom error types for better error handling
class ExtensionError extends Error {
    constructor(
        message: string,
        public code: string,
        public recoverable: boolean = false,
        public userMessage?: string
    ) {
        super(message);
        this.name = 'ExtensionError';
    }
}

class ServiceUnavailableError extends ExtensionError {
    constructor(serviceName: string) {
        super(
            `Service ${serviceName} is not available`,
            'SERVICE_UNAVAILABLE',
            false,
            'This feature is not available in your current environment.'
        );
    }
}

class ContextMissingError extends ExtensionError {
    constructor(contextType: string) {
        super(
            `${contextType} context is not available`,
            'CONTEXT_MISSING',
            false,
            'Required context information is not available.'
        );
    }
}

class NetworkError extends ExtensionError {
    constructor(message: string, public statusCode?: number) {
        super(
            message,
            'NETWORK_ERROR',
            true,
            'Network error occurred. Please check your connection and try again.'
        );
    }
}

// Error handling utility class
class ErrorHandler {
    private errorQueue: ExtensionError[] = [];
    private maxErrors = 10;

    /**
     * Handle and log an error
     */
    handleError(error: Error | ExtensionError, context?: string): ExtensionError {
        const extensionError = this.normalizeError(error);
        
        // Log error details
        console.error(`[${context || 'Extension'}] Error:`, {
            code: extensionError.code,
            message: extensionError.message,
            recoverable: extensionError.recoverable,
            stack: extensionError.stack
        });

        // Add to error queue
        this.errorQueue.push(extensionError);
        if (this.errorQueue.length > this.maxErrors) {
            this.errorQueue.shift();
        }

        return extensionError;
    }

    /**
     * Convert any error to ExtensionError
     */
    private normalizeError(error: Error | ExtensionError): ExtensionError {
        if (error instanceof ExtensionError) {
            return error;
        }

        // Handle common error types
        if (error.message.includes('not available') || error.message.includes('undefined')) {
            return new ServiceUnavailableError('Unknown service');
        }

        if (error.message.includes('network') || error.message.includes('fetch')) {
            return new NetworkError(error.message);
        }

        // Generic extension error
        return new ExtensionError(
            error.message,
            'UNKNOWN_ERROR',
            false,
            'An unexpected error occurred. Please try refreshing the page.'
        );
    }

    /**
     * Get recent errors
     */
    getRecentErrors(): ExtensionError[] {
        return [...this.errorQueue];
    }

    /**
     * Clear error queue
     */
    clearErrors(): void {
        this.errorQueue = [];
    }
}

// Retry utility with exponential backoff
class RetryHandler {
    /**
     * Execute operation with retry logic
     */
    static async withRetry<T>(
        operation: () => Promise<T>,
        options: {
            maxAttempts?: number;
            baseDelay?: number;
            maxDelay?: number;
            exponentialBackoff?: boolean;
            retryCondition?: (error: Error) => boolean;
        } = {}
    ): Promise<T> {
        const {
            maxAttempts = 3,
            baseDelay = 1000,
            maxDelay = 10000,
            exponentialBackoff = true,
            retryCondition = (error) => error instanceof NetworkError || error.message.includes('timeout')
        } = options;

        let lastError: Error;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                
                console.warn(`Attempt ${attempt}/${maxAttempts} failed:`, error.message);

                // Check if we should retry
                if (attempt === maxAttempts || !retryCondition(error)) {
                    break;
                }

                // Calculate delay
                let delay = baseDelay;
                if (exponentialBackoff) {
                    delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
                }

                // Add jitter to prevent thundering herd
                delay += Math.random() * 1000;

                console.log(`Retrying in ${Math.round(delay)}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError;
    }
}

// Circuit breaker pattern for failing services
class CircuitBreaker {
    private failures = 0;
    private lastFailureTime = 0;
    private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

    constructor(
        private threshold: number = 5,
        private timeout: number = 60000 // 1 minute
    ) {}

    /**
     * Execute operation through circuit breaker
     */
    async execute<T>(operation: () => Promise<T>): Promise<T> {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.timeout) {
                this.state = 'HALF_OPEN';
                console.log('Circuit breaker: Moving to HALF_OPEN state');
            } else {
                throw new ExtensionError(
                    'Circuit breaker is OPEN',
                    'CIRCUIT_OPEN',
                    true,
                    'Service temporarily unavailable. Please try again later.'
                );
            }
        }

        try {
            const result = await operation();
            
            if (this.state === 'HALF_OPEN') {
                this.reset();
            }
            
            return result;
        } catch (error) {
            this.recordFailure();
            throw error;
        }
    }

    private recordFailure(): void {
        this.failures++;
        this.lastFailureTime = Date.now();

        if (this.failures >= this.threshold) {
            this.state = 'OPEN';
            console.warn(`Circuit breaker: OPEN after ${this.failures} failures`);
        }
    }

    private reset(): void {
        this.failures = 0;
        this.state = 'CLOSED';
        console.log('Circuit breaker: Reset to CLOSED state');
    }

    getState(): string {
        return this.state;
    }
}

// Main error handling demonstration class
class ErrorHandlingDemo {
    private errorHandler = new ErrorHandler();
    private buildServiceBreaker = new CircuitBreaker(3, 30000);
    private dataServiceBreaker = new CircuitBreaker(3, 30000);

    /**
     * Initialize with comprehensive error handling
     */
    async initialize(): Promise<void> {
        try {
            console.log('Starting extension initialization with error handling...');

            // Initialize SDK with timeout
            await this.initializeSDKWithTimeout();

            // Validate context availability
            await this.validateContext();

            // Initialize services with error handling
            await this.initializeServicesWithErrorHandling();

            // Setup error reporting UI
            this.setupErrorReporting();

            // Test error scenarios (for demonstration)
            await this.demonstrateErrorScenarios();

            await SDK.notifyLoadSucceeded();
            console.log('Extension initialized successfully with error handling');

        } catch (error) {
            const handledError = this.errorHandler.handleError(error, 'Initialization');
            await this.handleInitializationFailure(handledError);
        }
    }

    /**
     * Initialize SDK with timeout protection
     */
    private async initializeSDKWithTimeout(): Promise<void> {
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('SDK initialization timeout')), 10000);
        });

        try {
            await Promise.race([
                SDK.init({ loaded: false, applyTheme: true }),
                timeoutPromise
            ]);
        } catch (error) {
            throw new ExtensionError(
                'SDK initialization failed or timed out',
                'SDK_INIT_FAILED',
                false,
                'Extension failed to initialize. Please refresh the page.'
            );
        }
    }

    /**
     * Validate required context availability
     */
    private async validateContext(): Promise<void> {
        try {
            // Check user context
            const user = SDK.getUser();
            if (!user || !user.id) {
                throw new ContextMissingError('User');
            }

            // Check web context
            const webContext = SDK.getWebContext();
            if (!webContext) {
                throw new ContextMissingError('Web');
            }

            // Check project context (if required)
            if (!webContext.project) {
                console.warn('Project context not available - some features may be limited');
            }

            // Check configuration
            const config = SDK.getConfiguration();
            if (!config) {
                console.warn('Configuration not available - using defaults');
            }

            console.log('Context validation completed successfully');
        } catch (error) {
            throw this.errorHandler.handleError(error, 'Context Validation');
        }
    }

    /**
     * Initialize services with comprehensive error handling
     */
    private async initializeServicesWithErrorHandling(): Promise<void> {
        const services = [
            { id: 'ms.vss-build-web.build-service', name: 'Build Service' },
            { id: 'ms.vss-features.extension-data-service', name: 'Extension Data Service' }
        ];

        const serviceResults = await Promise.allSettled(
            services.map(service => this.initializeService(service.id, service.name))
        );

        // Analyze results
        const successful = serviceResults.filter(result => result.status === 'fulfilled').length;
        const failed = serviceResults.filter(result => result.status === 'rejected').length;

        console.log(`Service initialization: ${successful} successful, ${failed} failed`);

        // Handle partial failures
        if (failed > 0) {
            const errors = serviceResults
                .filter(result => result.status === 'rejected')
                .map(result => (result as PromiseRejectedResult).reason);

            console.warn('Some services failed to initialize:', errors);
            this.showPartialServiceWarning(successful, failed);
        }
    }

    /**
     * Initialize a single service with error handling
     */
    private async initializeService(serviceId: string, serviceName: string): Promise<any> {
        try {
            return await RetryHandler.withRetry(
                async () => {
                    const service = await SDK.getService(serviceId);
                    if (!service) {
                        throw new ServiceUnavailableError(serviceName);
                    }
                    return service;
                },
                {
                    maxAttempts: 2,
                    baseDelay: 500,
                    retryCondition: (error) => !error.message.includes('not available')
                }
            );
        } catch (error) {
            throw this.errorHandler.handleError(error, `Service: ${serviceName}`);
        }
    }

    /**
     * Demonstrate various error scenarios
     */
    private async demonstrateErrorScenarios(): Promise<void> {
        console.log('\n=== Demonstrating Error Scenarios ===');

        // 1. Service call with circuit breaker
        await this.demonstrateServiceWithCircuitBreaker();

        // 2. Network error simulation
        await this.demonstrateNetworkError();

        // 3. Data validation error
        await this.demonstrateValidationError();

        // 4. Recovery after error
        await this.demonstrateErrorRecovery();
    }

    /**
     * Demonstrate service calls with circuit breaker
     */
    private async demonstrateServiceWithCircuitBreaker(): Promise<void> {
        console.log('\n--- Circuit Breaker Demo ---');

        // Simulate multiple failing calls to trigger circuit breaker
        for (let i = 1; i <= 5; i++) {
            try {
                await this.buildServiceBreaker.execute(async () => {
                    // Simulate a failing service call
                    if (Math.random() < 0.8) { // 80% failure rate for demo
                        throw new NetworkError('Simulated service failure');
                    }
                    return { success: true };
                });
                console.log(`Call ${i}: Success`);
            } catch (error) {
                console.log(`Call ${i}: Failed - ${error.message}`);
            }
        }

        console.log(`Circuit breaker state: ${this.buildServiceBreaker.getState()}`);
    }

    /**
     * Demonstrate network error handling
     */
    private async demonstrateNetworkError(): Promise<void> {
        console.log('\n--- Network Error Demo ---');

        try {
            await RetryHandler.withRetry(
                async () => {
                    // Simulate network call
                    throw new NetworkError('Connection timeout', 408);
                },
                {
                    maxAttempts: 3,
                    baseDelay: 1000
                }
            );
        } catch (error) {
            const handledError = this.errorHandler.handleError(error, 'Network Operation');
            console.log('Final network error handled:', handledError.userMessage);
        }
    }

    /**
     * Demonstrate validation error
     */
    private async demonstrateValidationError(): Promise<void> {
        console.log('\n--- Validation Error Demo ---');

        try {
            // Simulate data validation
            const invalidData = { buildId: 'invalid' };
            this.validateBuildId(invalidData.buildId);
        } catch (error) {
            const handledError = this.errorHandler.handleError(error, 'Data Validation');
            console.log('Validation error handled:', handledError.userMessage);
        }
    }

    /**
     * Demonstrate error recovery
     */
    private async demonstrateErrorRecovery(): Promise<void> {
        console.log('\n--- Error Recovery Demo ---');

        // Show how to gracefully recover from errors
        const fallbackData = await this.loadDataWithFallback();
        console.log('Data loaded with fallback:', fallbackData);
    }

    /**
     * Load data with fallback mechanisms
     */
    private async loadDataWithFallback(): Promise<any> {
        try {
            // Try primary data source
            return await this.loadPrimaryData();
        } catch (error) {
            console.warn('Primary data source failed, trying fallback...');
            
            try {
                // Try secondary data source
                return await this.loadSecondaryData();
            } catch (fallbackError) {
                console.warn('Secondary data source failed, using cached data...');
                
                // Use cached data as last resort
                return this.loadCachedData();
            }
        }
    }

    /**
     * Simulate primary data loading (fails for demo)
     */
    private async loadPrimaryData(): Promise<any> {
        throw new NetworkError('Primary service unavailable');
    }

    /**
     * Simulate secondary data loading (fails for demo)
     */
    private async loadSecondaryData(): Promise<any> {
        throw new NetworkError('Secondary service unavailable');
    }

    /**
     * Load cached data as fallback
     */
    private loadCachedData(): any {
        return {
            source: 'cache',
            data: 'Cached fallback data',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Validate build ID
     */
    private validateBuildId(buildId: any): number {
        if (typeof buildId !== 'string' && typeof buildId !== 'number') {
            throw new ExtensionError(
                'Build ID must be a string or number',
                'INVALID_BUILD_ID',
                false,
                'Please provide a valid build ID.'
            );
        }

        const parsed = parseInt(buildId.toString());
        if (isNaN(parsed) || parsed <= 0) {
            throw new ExtensionError(
                'Build ID must be a positive number',
                'INVALID_BUILD_ID',
                false,
                'Please provide a valid build ID.'
            );
        }

        return parsed;
    }

    /**
     * Setup error reporting UI
     */
    private setupErrorReporting(): void {
        const container = document.createElement('div');
        container.innerHTML = `
            <div style="font-family: Segoe UI; padding: 20px; max-width: 800px;">
                <h2>Error Handling Demo</h2>
                <div id="error-summary"></div>
                <div id="error-list" style="margin-top: 20px;"></div>
                <button onclick="window.errorDemo.showErrorReport()" style="margin-top: 10px; padding: 8px 16px;">
                    Show Error Report
                </button>
                <button onclick="window.errorDemo.clearErrors()" style="margin-top: 10px; padding: 8px 16px; margin-left: 10px;">
                    Clear Errors
                </button>
            </div>
        `;

        document.body.appendChild(container);
        (window as any).errorDemo = this;

        this.updateErrorDisplay();
    }

    /**
     * Update error display
     */
    private updateErrorDisplay(): void {
        const summaryElement = document.getElementById('error-summary');
        const listElement = document.getElementById('error-list');
        
        const errors = this.errorHandler.getRecentErrors();
        
        if (summaryElement) {
            summaryElement.innerHTML = `
                <p><strong>Total Errors:</strong> ${errors.length}</p>
                <p><strong>Recoverable:</strong> ${errors.filter(e => e.recoverable).length}</p>
                <p><strong>Critical:</strong> ${errors.filter(e => !e.recoverable).length}</p>
            `;
        }

        if (listElement && errors.length > 0) {
            listElement.innerHTML = `
                <h3>Recent Errors:</h3>
                <ul>
                    ${errors.map(error => `
                        <li style="margin: 10px 0; padding: 10px; border-left: 3px solid ${error.recoverable ? 'orange' : 'red'}; background: #f5f5f5;">
                            <strong>Code:</strong> ${error.code}<br>
                            <strong>Message:</strong> ${error.message}<br>
                            <strong>User Message:</strong> ${error.userMessage || 'N/A'}<br>
                            <strong>Recoverable:</strong> ${error.recoverable ? 'Yes' : 'No'}
                        </li>
                    `).join('')}
                </ul>
            `;
        }
    }

    /**
     * Handle initialization failure
     */
    private async handleInitializationFailure(error: ExtensionError): Promise<void> {
        console.error('Extension initialization failed:', error);

        // Show user-friendly error message
        document.body.innerHTML = `
            <div style="font-family: Segoe UI; padding: 20px; text-align: center;">
                <h2 style="color: #d13438;">Extension Failed to Load</h2>
                <p>${error.userMessage || 'An unexpected error occurred.'}</p>
                <p><small>Error Code: ${error.code}</small></p>
                ${error.recoverable ? `
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #0078d4; color: white; border: none; border-radius: 4px;">
                        Retry
                    </button>
                ` : ''}
            </div>
        `;

        await SDK.notifyLoadFailed(error);
    }

    /**
     * Show partial service warning
     */
    private showPartialServiceWarning(successful: number, failed: number): void {
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed; top: 10px; right: 10px; 
            background: #ff8c00; color: white; 
            padding: 10px; border-radius: 4px; 
            font-family: Segoe UI; z-index: 1000;
        `;
        warning.innerHTML = `
            ⚠ Some features may be limited<br>
            ${successful} services available, ${failed} unavailable
        `;
        
        document.body.appendChild(warning);

        // Auto-hide after 5 seconds
        setTimeout(() => warning.remove(), 5000);
    }

    // ============================================================================
    // PUBLIC METHODS (for demo UI)
    // ============================================================================

    /**
     * Show error report
     */
    showErrorReport(): void {
        const errors = this.errorHandler.getRecentErrors();
        const report = {
            timestamp: new Date().toISOString(),
            totalErrors: errors.length,
            errors: errors.map(error => ({
                code: error.code,
                message: error.message,
                recoverable: error.recoverable,
                userMessage: error.userMessage
            }))
        };

        console.log('Error Report:', JSON.stringify(report, null, 2));
        alert('Error report logged to console');
    }

    /**
     * Clear all errors
     */
    clearErrors(): void {
        this.errorHandler.clearErrors();
        this.updateErrorDisplay();
        console.log('All errors cleared');
    }
}

// Example usage function
async function demonstrateErrorHandling(): Promise<void> {
    try {
        const demo = new ErrorHandlingDemo();
        await demo.initialize();
    } catch (error) {
        console.error('Error handling demonstration failed:', error);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    demonstrateErrorHandling();
});

// Export classes for use in other modules
export { 
    ErrorHandlingDemo, 
    ExtensionError, 
    ServiceUnavailableError, 
    ContextMissingError, 
    NetworkError,
    ErrorHandler,
    RetryHandler,
    CircuitBreaker,
    demonstrateErrorHandling 
};