/**
 * Error Handling Pipeline Task Example
 * 
 * This example demonstrates comprehensive error handling patterns and strategies
 * using azure-pipelines-task-lib, including different types of failures,
 * recovery mechanisms, and graceful degradation.
 * 
 * Features demonstrated:
 * - Different error types and handling strategies
 * - Retry mechanisms with exponential backoff
 * - Circuit breaker pattern
 * - Graceful degradation
 * - Error categorization and reporting
 * - Cleanup and resource management
 * - User-friendly error messages
 * - Error logging and diagnostics
 * - Conditional error handling based on severity
 */

import tl = require('azure-pipelines-task-lib/task');
import * as path from 'path';

// Error categories for better handling
enum ErrorCategory {
    Configuration = 'Configuration',
    Network = 'Network',
    FileSystem = 'FileSystem',
    Authentication = 'Authentication',
    Validation = 'Validation',
    External = 'External',
    Unknown = 'Unknown'
}

// Error severity levels
enum ErrorSeverity {
    Critical = 'Critical',      // Task must fail
    High = 'High',             // Task should fail unless skipOnError is true
    Medium = 'Medium',         // Task continues with warnings
    Low = 'Low'                // Task continues with info
}

// Custom error class with additional context
class TaskError extends Error {
    constructor(
        message: string,
        public category: ErrorCategory = ErrorCategory.Unknown,
        public severity: ErrorSeverity = ErrorSeverity.High,
        public details?: any,
        public suggestions?: string[]
    ) {
        super(message);
        this.name = 'TaskError';
    }
}

// Interface for retry configuration
interface RetryConfig {
    maxAttempts: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
    retryableErrors: ErrorCategory[];
}

// Interface for circuit breaker state
interface CircuitBreakerState {
    failures: number;
    lastFailureTime: number;
    state: 'closed' | 'open' | 'half-open';
    threshold: number;
    timeoutMs: number;
}

// Interface for task inputs
interface ErrorHandlingTaskInputs {
    operationMode: string;
    skipOnError: boolean;
    continueOnWarnings: boolean;
    maxRetryAttempts: number;
    enableCircuitBreaker: boolean;
    detailedErrorReporting: boolean;
    simulateErrors: boolean;
    errorThreshold: number;
}

// Global circuit breaker state (in real implementation, this might be persisted)
const circuitBreakerState: CircuitBreakerState = {
    failures: 0,
    lastFailureTime: 0,
    state: 'closed',
    threshold: 5,
    timeoutMs: 60000 // 1 minute
};

/**
 * Main task execution function with comprehensive error handling
 */
async function run(): Promise<void> {
    let cleanup: (() => Promise<void>) | null = null;
    
    try {
        console.log('Starting Error Handling Pipeline Task...');
        
        // Initialize cleanup function
        cleanup = await initializeResources();
        
        // Get and validate inputs
        const inputs = getTaskInputs();
        if (!validateInputs(inputs)) {
            return;
        }
        
        // Configure retry settings
        const retryConfig = createRetryConfig(inputs);
        
        // Execute main operations with error handling
        await executeWithErrorHandling(inputs, retryConfig);
        
        // Success
        tl.setResult(tl.TaskResult.Succeeded, 'Error handling task completed successfully');
        
    } catch (error) {
        await handleFinalError(error);
    } finally {
        // Always perform cleanup
        if (cleanup) {
            await performCleanup(cleanup);
        }
    }
}

/**
 * Initializes resources and returns cleanup function
 */
async function initializeResources(): Promise<() => Promise<void>> {
    tl.debug('Initializing resources...');
    
    const tempFiles: string[] = [];
    const openConnections: any[] = [];
    
    try {
        // Initialize temporary directories
        const tempDir = path.join(tl.getVariable('Agent.TempDirectory') || '', 'error-handling-task');
        if (!tl.exist(tempDir)) {
            tl.mkdirP(tempDir);
            tempFiles.push(tempDir);
        }
        
        // Setup logging
        const logFile = path.join(tempDir, 'task-execution.log');
        tempFiles.push(logFile);
        
        tl.debug('✓ Resources initialized successfully');
        
        // Return cleanup function
        return async (): Promise<void> => {
            tl.debug('Performing resource cleanup...');
            
            // Close connections
            for (const connection of openConnections) {
                try {
                    if (connection && typeof connection.close === 'function') {
                        await connection.close();
                    }
                } catch (error) {
                    tl.warning(`Failed to close connection: ${error.message}`);
                }
            }
            
            // Cleanup temporary files
            for (const file of tempFiles) {
                try {
                    if (tl.exist(file)) {
                        tl.debug(`Cleaning up: ${file}`);
                        // In real implementation, use proper file deletion
                    }
                } catch (error) {
                    tl.warning(`Failed to cleanup ${file}: ${error.message}`);
                }
            }
            
            tl.debug('✓ Resource cleanup completed');
        };
        
    } catch (error) {
        throw new TaskError(
            'Failed to initialize resources',
            ErrorCategory.Configuration,
            ErrorSeverity.Critical,
            error,
            ['Check agent permissions', 'Verify temp directory is accessible']
        );
    }
}

/**
 * Retrieves and parses task inputs
 */
function getTaskInputs(): ErrorHandlingTaskInputs {
    tl.debug('Retrieving task inputs...');
    
    return {
        operationMode: tl.getInput('operationMode') || 'normal',
        skipOnError: tl.getBoolInput('skipOnError', false),
        continueOnWarnings: tl.getBoolInput('continueOnWarnings', true),
        maxRetryAttempts: parseInt(tl.getInput('maxRetryAttempts') || '3'),
        enableCircuitBreaker: tl.getBoolInput('enableCircuitBreaker', true),
        detailedErrorReporting: tl.getBoolInput('detailedErrorReporting', true),
        simulateErrors: tl.getBoolInput('simulateErrors', false),
        errorThreshold: parseInt(tl.getInput('errorThreshold') || '10')
    };
}

/**
 * Validates task inputs with detailed error messages
 */
function validateInputs(inputs: ErrorHandlingTaskInputs): boolean {
    tl.debug('Validating task inputs...');
    
    try {
        // Validate operation mode
        const validModes = ['normal', 'strict', 'permissive'];
        if (!validModes.includes(inputs.operationMode)) {
            throw new TaskError(
                `Invalid operation mode: ${inputs.operationMode}`,
                ErrorCategory.Configuration,
                ErrorSeverity.Critical,
                { validModes, providedMode: inputs.operationMode },
                [`Use one of the valid modes: ${validModes.join(', ')}`]
            );
        }
        
        // Validate retry attempts
        if (inputs.maxRetryAttempts < 0 || inputs.maxRetryAttempts > 10) {
            throw new TaskError(
                'Max retry attempts must be between 0 and 10',
                ErrorCategory.Configuration,
                ErrorSeverity.High,
                { provided: inputs.maxRetryAttempts },
                ['Set maxRetryAttempts to a value between 0 and 10']
            );
        }
        
        // Validate error threshold
        if (inputs.errorThreshold < 1 || inputs.errorThreshold > 100) {
            throw new TaskError(
                'Error threshold must be between 1 and 100',
                ErrorCategory.Configuration,
                ErrorSeverity.High,
                { provided: inputs.errorThreshold },
                ['Set errorThreshold to a percentage value between 1 and 100']
            );
        }
        
        tl.debug('✓ All inputs validated successfully');
        return true;
        
    } catch (error) {
        if (error instanceof TaskError) {
            logDetailedError(error);
        } else {
            tl.error(`Validation failed: ${error.message}`);
        }
        
        tl.setResult(tl.TaskResult.Failed, error.message);
        return false;
    }
}

/**
 * Creates retry configuration based on inputs
 */
function createRetryConfig(inputs: ErrorHandlingTaskInputs): RetryConfig {
    return {
        maxAttempts: inputs.maxRetryAttempts,
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        backoffMultiplier: 2,
        retryableErrors: [
            ErrorCategory.Network,
            ErrorCategory.External,
            ErrorCategory.FileSystem
        ]
    };
}

/**
 * Executes main operations with comprehensive error handling
 */
async function executeWithErrorHandling(
    inputs: ErrorHandlingTaskInputs,
    retryConfig: RetryConfig
): Promise<void> {
    
    tl.debug('Executing main operations with error handling...');
    
    const operations = [
        { name: 'Configuration Validation', fn: () => validateConfiguration(inputs) },
        { name: 'File System Operations', fn: () => performFileSystemOperations(inputs) },
        { name: 'Network Operations', fn: () => performNetworkOperations(inputs) },
        { name: 'Data Processing', fn: () => performDataProcessing(inputs) },
        { name: 'Cleanup Validation', fn: () => validateCleanup(inputs) }
    ];
    
    const results = {
        successful: 0,
        failed: 0,
        warnings: 0,
        errors: [] as TaskError[]
    };
    
    for (const operation of operations) {
        try {
            tl.debug(`Executing operation: ${operation.name}`);
            
            // Execute with retry logic
            await executeWithRetry(operation.fn, retryConfig, operation.name);
            
            results.successful++;
            tl.debug(`✓ ${operation.name} completed successfully`);
            
        } catch (error) {
            const taskError = error instanceof TaskError ? error : new TaskError(
                `${operation.name} failed: ${error.message}`,
                ErrorCategory.Unknown,
                ErrorSeverity.High,
                error
            );
            
            results.errors.push(taskError);
            
            if (taskError.severity === ErrorSeverity.Critical) {
                results.failed++;
                throw taskError; // Stop execution on critical errors
            } else if (taskError.severity === ErrorSeverity.High && !inputs.skipOnError) {
                results.failed++;
                throw taskError;
            } else if (taskError.severity === ErrorSeverity.Medium) {
                results.warnings++;
                tl.warning(`${operation.name} completed with warnings: ${taskError.message}`);
                logDetailedError(taskError);
            } else {
                tl.debug(`${operation.name} completed with minor issues: ${taskError.message}`);
                logDetailedError(taskError);
            }
        }
    }
    
    // Evaluate overall results
    await evaluateResults(results, inputs);
}

/**
 * Executes an operation with retry logic
 */
async function executeWithRetry<T>(
    operation: () => Promise<T>,
    retryConfig: RetryConfig,
    operationName: string
): Promise<T> {
    
    let lastError: Error;
    let delayMs = retryConfig.initialDelayMs;
    
    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
        try {
            // Check circuit breaker before attempting
            if (!checkCircuitBreaker(operationName)) {
                throw new TaskError(
                    'Circuit breaker is open - operation temporarily disabled',
                    ErrorCategory.External,
                    ErrorSeverity.High,
                    { circuitBreakerState },
                    ['Wait for circuit breaker to reset', 'Check external service health']
                );
            }
            
            const result = await operation();
            
            // Reset circuit breaker on success
            resetCircuitBreaker();
            
            if (attempt > 1) {
                tl.debug(`✓ ${operationName} succeeded on attempt ${attempt}`);
            }
            
            return result;
            
        } catch (error) {
            lastError = error;
            recordCircuitBreakerFailure();
            
            // Check if error is retryable
            const isRetryable = error instanceof TaskError && 
                retryConfig.retryableErrors.includes(error.category);
            
            if (attempt === retryConfig.maxAttempts || !isRetryable) {
                tl.debug(`${operationName} failed after ${attempt} attempts`);
                throw error;
            }
            
            tl.warning(`${operationName} failed on attempt ${attempt}, retrying in ${delayMs}ms: ${error.message}`);
            
            // Wait before retrying
            await delay(delayMs);
            
            // Exponential backoff
            delayMs = Math.min(delayMs * retryConfig.backoffMultiplier, retryConfig.maxDelayMs);
        }
    }
    
    throw lastError!;
}

/**
 * Circuit breaker implementation
 */
function checkCircuitBreaker(operationName: string): boolean {
    const now = Date.now();
    
    switch (circuitBreakerState.state) {
        case 'closed':
            return true;
            
        case 'open':
            if (now - circuitBreakerState.lastFailureTime > circuitBreakerState.timeoutMs) {
                circuitBreakerState.state = 'half-open';
                tl.debug(`Circuit breaker for ${operationName} transitioning to half-open`);
                return true;
            }
            return false;
            
        case 'half-open':
            return true;
            
        default:
            return true;
    }
}

/**
 * Records a circuit breaker failure
 */
function recordCircuitBreakerFailure(): void {
    circuitBreakerState.failures++;
    circuitBreakerState.lastFailureTime = Date.now();
    
    if (circuitBreakerState.failures >= circuitBreakerState.threshold) {
        circuitBreakerState.state = 'open';
        tl.warning(`Circuit breaker opened due to ${circuitBreakerState.failures} failures`);
    }
}

/**
 * Resets the circuit breaker on successful operation
 */
function resetCircuitBreaker(): void {
    if (circuitBreakerState.state !== 'closed') {
        circuitBreakerState.state = 'closed';
        circuitBreakerState.failures = 0;
        tl.debug('Circuit breaker reset to closed state');
    }
}

/**
 * Example operation: Configuration validation
 */
async function validateConfiguration(inputs: ErrorHandlingTaskInputs): Promise<void> {
    if (inputs.simulateErrors && Math.random() < 0.2) {
        throw new TaskError(
            'Simulated configuration error',
            ErrorCategory.Configuration,
            ErrorSeverity.Medium,
            { simulationMode: true },
            ['Check configuration file syntax', 'Verify all required settings are present']
        );
    }
    
    // Simulate work
    await delay(100);
}

/**
 * Example operation: File system operations
 */
async function performFileSystemOperations(inputs: ErrorHandlingTaskInputs): Promise<void> {
    if (inputs.simulateErrors && Math.random() < 0.15) {
        throw new TaskError(
            'File access denied',
            ErrorCategory.FileSystem,
            ErrorSeverity.High,
            { simulationMode: true },
            ['Check file permissions', 'Verify file path exists', 'Run agent with appropriate permissions']
        );
    }
    
    // Simulate file operations
    await delay(200);
}

/**
 * Example operation: Network operations
 */
async function performNetworkOperations(inputs: ErrorHandlingTaskInputs): Promise<void> {
    if (inputs.simulateErrors && Math.random() < 0.25) {
        throw new TaskError(
            'Network timeout connecting to external service',
            ErrorCategory.Network,
            ErrorSeverity.High,
            { simulationMode: true, timeout: 30000 },
            ['Check network connectivity', 'Verify service endpoint is accessible', 'Check firewall settings']
        );
    }
    
    // Simulate network operations
    await delay(300);
}

/**
 * Example operation: Data processing
 */
async function performDataProcessing(inputs: ErrorHandlingTaskInputs): Promise<void> {
    if (inputs.simulateErrors && Math.random() < 0.1) {
        throw new TaskError(
            'Invalid data format encountered',
            ErrorCategory.Validation,
            ErrorSeverity.Medium,
            { simulationMode: true },
            ['Validate input data format', 'Check data schema requirements', 'Use data transformation tools']
        );
    }
    
    // Simulate data processing
    await delay(150);
}

/**
 * Example operation: Cleanup validation
 */
async function validateCleanup(inputs: ErrorHandlingTaskInputs): Promise<void> {
    if (inputs.simulateErrors && Math.random() < 0.05) {
        throw new TaskError(
            'Cleanup validation failed',
            ErrorCategory.FileSystem,
            ErrorSeverity.Low,
            { simulationMode: true },
            ['Check temporary file cleanup', 'Verify resource disposal']
        );
    }
    
    // Simulate cleanup validation
    await delay(50);
}

/**
 * Evaluates overall operation results
 */
async function evaluateResults(
    results: { successful: number; failed: number; warnings: number; errors: TaskError[] },
    inputs: ErrorHandlingTaskInputs
): Promise<void> {
    
    tl.debug('Evaluating operation results...');
    
    const total = results.successful + results.failed + results.warnings;
    const successRate = total > 0 ? (results.successful / total) * 100 : 0;
    const errorRate = total > 0 ? ((results.failed + results.warnings) / total) * 100 : 0;
    
    tl.debug(`Success rate: ${successRate.toFixed(1)}%`);
    tl.debug(`Error rate: ${errorRate.toFixed(1)}%`);
    
    // Generate error summary report
    if (inputs.detailedErrorReporting && results.errors.length > 0) {
        await generateErrorReport(results.errors);
    }
    
    // Determine task result based on error rate and configuration
    if (results.failed > 0 && !inputs.skipOnError) {
        throw new TaskError(
            `Task failed: ${results.failed} critical operations failed, ${results.warnings} warnings`,
            ErrorCategory.Unknown,
            ErrorSeverity.Critical,
            results,
            ['Review error details below', 'Consider enabling skipOnError for non-critical failures']
        );
    } else if (errorRate > inputs.errorThreshold) {
        const message = `Error rate ${errorRate.toFixed(1)}% exceeds threshold ${inputs.errorThreshold}%`;
        
        if (inputs.continueOnWarnings) {
            tl.warning(message);
            tl.setResult(tl.TaskResult.SucceededWithIssues, message);
        } else {
            throw new TaskError(
                message,
                ErrorCategory.Validation,
                ErrorSeverity.High,
                results,
                ['Lower error threshold', 'Fix underlying issues', 'Enable continueOnWarnings']
            );
        }
    } else if (results.warnings > 0) {
        const message = `Task completed with ${results.warnings} warnings`;
        tl.warning(message);
        tl.setResult(tl.TaskResult.SucceededWithIssues, message);
    }
    
    // Set output variables
    tl.setVariable('OperationSuccessful', results.successful.toString());
    tl.setVariable('OperationsFailed', results.failed.toString());
    tl.setVariable('OperationsWarnings', results.warnings.toString());
    tl.setVariable('SuccessRate', successRate.toFixed(1));
    tl.setVariable('ErrorRate', errorRate.toFixed(1));
}

/**
 * Generates detailed error report
 */
async function generateErrorReport(errors: TaskError[]): Promise<void> {
    tl.debug('Generating detailed error report...');
    
    try {
        const stagingDir = tl.getVariable('Build.ArtifactStagingDirectory');
        if (!stagingDir) {
            tl.warning('Cannot generate error report - artifact staging directory not available');
            return;
        }
        
        const errorsByCategory = groupErrorsByCategory(errors);
        
        const reportContent = `# Error Handling Task Report

## Summary
- **Total Errors**: ${errors.length}
- **Categories Affected**: ${Object.keys(errorsByCategory).length}
- **Generated**: ${new Date().toISOString()}

## Errors by Category

${Object.entries(errorsByCategory).map(([category, categoryErrors]) => `
### ${category} Errors (${categoryErrors.length})

${categoryErrors.map((error, index) => `
#### Error ${index + 1}: ${error.message}

- **Severity**: ${error.severity}
- **Details**: ${error.details ? JSON.stringify(error.details, null, 2) : 'None'}
- **Suggestions**:
${error.suggestions?.map(suggestion => `  - ${suggestion}`).join('\n') || '  - No suggestions available'}

`).join('')}
`).join('')}

## Recommendations

### Immediate Actions
${getImmediateActions(errors).map(action => `- ${action}`).join('\n')}

### Long-term Improvements
${getLongTermImprovements(errors).map(improvement => `- ${improvement}`).join('\n')}

---
*Generated by Error Handling Pipeline Task*
`;
        
        const reportPath = path.join(stagingDir, 'error-report.md');
        tl.writeFile(reportPath, reportContent);
        
        // Add as attachment
        tl.addAttachment('error-report', 'ErrorReport', reportPath);
        
        tl.debug(`✓ Error report generated: ${reportPath}`);
        
    } catch (error) {
        tl.warning(`Failed to generate error report: ${error.message}`);
    }
}

/**
 * Groups errors by category
 */
function groupErrorsByCategory(errors: TaskError[]): { [category: string]: TaskError[] } {
    const groups: { [category: string]: TaskError[] } = {};
    
    for (const error of errors) {
        if (!groups[error.category]) {
            groups[error.category] = [];
        }
        groups[error.category].push(error);
    }
    
    return groups;
}

/**
 * Gets immediate action recommendations
 */
function getImmediateActions(errors: TaskError[]): string[] {
    const actions = new Set<string>();
    
    for (const error of errors) {
        if (error.suggestions) {
            error.suggestions.forEach(suggestion => actions.add(suggestion));
        }
    }
    
    if (actions.size === 0) {
        actions.add('Review error logs for specific issues');
        actions.add('Check system resources and permissions');
        actions.add('Verify network connectivity if applicable');
    }
    
    return Array.from(actions);
}

/**
 * Gets long-term improvement recommendations
 */
function getLongTermImprovements(errors: TaskError[]): string[] {
    const improvements = [
        'Implement automated health checks',
        'Add monitoring and alerting for critical operations',
        'Consider implementing graceful degradation patterns',
        'Review and update error handling strategies',
        'Add more comprehensive input validation',
        'Implement retry policies for transient failures'
    ];
    
    // Add specific improvements based on error categories
    const categories = [...new Set(errors.map(error => error.category))];
    
    if (categories.includes(ErrorCategory.Network)) {
        improvements.push('Implement network resilience patterns');
        improvements.push('Add connection pooling and timeout configurations');
    }
    
    if (categories.includes(ErrorCategory.FileSystem)) {
        improvements.push('Add file system health checks');
        improvements.push('Implement file locking and concurrency handling');
    }
    
    if (categories.includes(ErrorCategory.Configuration)) {
        improvements.push('Add configuration validation at startup');
        improvements.push('Implement configuration schema validation');
    }
    
    return improvements;
}

/**
 * Logs detailed error information
 */
function logDetailedError(error: TaskError): void {
    tl.error(`${error.category} Error (${error.severity}): ${error.message}`);
    
    if (error.details) {
        tl.debug(`Error details: ${JSON.stringify(error.details, null, 2)}`);
    }
    
    if (error.suggestions && error.suggestions.length > 0) {
        tl.debug('Suggestions:');
        error.suggestions.forEach(suggestion => tl.debug(`  - ${suggestion}`));
    }
}

/**
 * Handles final error before task completion
 */
async function handleFinalError(error: any): Promise<void> {
    if (error instanceof TaskError) {
        logDetailedError(error);
        tl.setResult(
            error.severity === ErrorSeverity.Critical ? tl.TaskResult.Failed : tl.TaskResult.SucceededWithIssues,
            error.message
        );
    } else {
        tl.error(`Unexpected error: ${error.message || error}`);
        tl.setResult(tl.TaskResult.Failed, `Unexpected error: ${error.message || error}`);
    }
}

/**
 * Performs cleanup operations
 */
async function performCleanup(cleanup: () => Promise<void>): Promise<void> {
    try {
        await cleanup();
    } catch (error) {
        tl.warning(`Cleanup failed: ${error.message}`);
    }
}

/**
 * Utility function for delays
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Entry point
if (require.main === module) {
    run().catch((error) => {
        tl.error(`Unhandled error in error handling task: ${error}`);
        tl.setResult(tl.TaskResult.Failed, 'Unhandled error in error handling task');
        process.exit(1);
    });
}

// Export classes and functions for testing
export { 
    run, 
    TaskError, 
    ErrorCategory, 
    ErrorSeverity, 
    getTaskInputs, 
    validateInputs, 
    executeWithRetry,
    checkCircuitBreaker,
    generateErrorReport
};