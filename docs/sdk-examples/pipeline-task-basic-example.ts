/**
 * Basic Azure Pipeline Task Example
 * 
 * This example demonstrates the fundamental structure and patterns for creating
 * an Azure DevOps pipeline task using azure-pipelines-task-lib.
 * 
 * Features demonstrated:
 * - Input validation and retrieval
 * - Environment setup and validation
 * - Basic error handling
 * - Logging and debugging
 * - Task result reporting
 */

import tl = require('azure-pipelines-task-lib/task');
import * as path from 'path';

// Interface for task inputs
interface TaskInputs {
    sourceDirectory: string;
    outputDirectory: string;
    buildConfiguration: string;
    enableVerboseLogging: boolean;
    timeout: number;
    skipOnError: boolean;
}

/**
 * Main task execution function
 */
async function run(): Promise<void> {
    try {
        console.log('Starting Basic Pipeline Task...');
        
        // Step 1: Get and validate inputs
        const inputs = getTaskInputs();
        if (!validateInputs(inputs)) {
            return; // Error already reported
        }
        
        // Step 2: Log environment information (if verbose logging enabled)
        if (inputs.enableVerboseLogging) {
            logEnvironmentInfo();
        }
        
        // Step 3: Execute main task logic
        await executeMainTask(inputs);
        
        // Step 4: Report success
        const message = `Task completed successfully. Processed ${inputs.sourceDirectory} -> ${inputs.outputDirectory}`;
        tl.setResult(tl.TaskResult.Succeeded, message);
        console.log(message);
        
    } catch (error) {
        // Handle unexpected errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        tl.error(`Task execution failed: ${errorMessage}`);
        tl.setResult(tl.TaskResult.Failed, `Task execution failed: ${errorMessage}`);
    }
}

/**
 * Retrieves and parses task inputs
 */
function getTaskInputs(): TaskInputs {
    tl.debug('Retrieving task inputs...');
    
    return {
        // Required inputs
        sourceDirectory: tl.getInputRequired('sourceDirectory'),
        outputDirectory: tl.getInputRequired('outputDirectory'),
        
        // Optional inputs with defaults
        buildConfiguration: tl.getInput('buildConfiguration') || 'Release',
        enableVerboseLogging: tl.getBoolInput('enableVerboseLogging', false),
        timeout: parseInt(tl.getInput('timeout') || '300'), // 5 minutes default
        skipOnError: tl.getBoolInput('skipOnError', false)
    };
}

/**
 * Validates task inputs
 */
function validateInputs(inputs: TaskInputs): boolean {
    tl.debug('Validating task inputs...');
    
    // Validate source directory exists
    if (!tl.exist(inputs.sourceDirectory)) {
        tl.setResult(
            tl.TaskResult.Failed, 
            `Source directory does not exist: ${inputs.sourceDirectory}`
        );
        return false;
    }
    
    // Ensure source directory is actually a directory
    const sourceStats = tl.stats(inputs.sourceDirectory);
    if (!sourceStats.isDirectory()) {
        tl.setResult(
            tl.TaskResult.Failed, 
            `Source path is not a directory: ${inputs.sourceDirectory}`
        );
        return false;
    }
    
    // Validate timeout
    if (inputs.timeout <= 0) {
        tl.setResult(
            tl.TaskResult.Failed, 
            `Timeout must be greater than 0, got: ${inputs.timeout}`
        );
        return false;
    }
    
    // Validate build configuration
    const validConfigurations = ['Debug', 'Release'];
    if (!validConfigurations.includes(inputs.buildConfiguration)) {
        tl.setResult(
            tl.TaskResult.Failed, 
            `Invalid build configuration: ${inputs.buildConfiguration}. Valid values: ${validConfigurations.join(', ')}`
        );
        return false;
    }
    
    tl.debug('✓ All inputs validated successfully');
    return true;
}

/**
 * Logs relevant environment information for debugging
 */
function logEnvironmentInfo(): void {
    tl.debug('=== Environment Information ===');
    
    // System information
    tl.debug(`Agent OS: ${tl.getVariable('Agent.OS')}`);
    tl.debug(`Agent Name: ${tl.getVariable('Agent.Name')}`);
    tl.debug(`Agent Version: ${tl.getVariable('Agent.Version')}`);
    
    // Build information
    tl.debug(`Build ID: ${tl.getVariable('Build.BuildId')}`);
    tl.debug(`Build Number: ${tl.getVariable('Build.BuildNumber')}`);
    tl.debug(`Build Reason: ${tl.getVariable('Build.Reason')}`);
    
    // Source information
    tl.debug(`Repository: ${tl.getVariable('Build.Repository.Name')}`);
    tl.debug(`Branch: ${tl.getVariable('Build.SourceBranchName')}`);
    tl.debug(`Commit: ${tl.getVariable('Build.SourceVersion')}`);
    
    // Directory paths
    tl.debug(`Working Directory: ${tl.getVariable('System.DefaultWorkingDirectory')}`);
    tl.debug(`Artifact Staging: ${tl.getVariable('Build.ArtifactStagingDirectory')}`);
    tl.debug(`Temp Directory: ${tl.getVariable('Agent.TempDirectory')}`);
    
    tl.debug('=== End Environment Information ===');
}

/**
 * Executes the main task logic
 */
async function executeMainTask(inputs: TaskInputs): Promise<void> {
    tl.debug('Executing main task logic...');
    
    try {
        // Step 1: Prepare output directory
        await prepareOutputDirectory(inputs.outputDirectory);
        
        // Step 2: Process source files
        const processedFiles = await processSourceFiles(inputs);
        
        // Step 3: Generate summary
        await generateTaskSummary(inputs, processedFiles);
        
        tl.debug(`✓ Main task logic completed successfully`);
        
    } catch (error) {
        if (inputs.skipOnError) {
            tl.warning(`Task encountered an error but continuing due to skipOnError=true: ${error.message}`);
            tl.setResult(tl.TaskResult.SucceededWithIssues, `Task completed with issues: ${error.message}`);
        } else {
            throw error; // Re-throw to be handled by caller
        }
    }
}

/**
 * Prepares the output directory
 */
async function prepareOutputDirectory(outputDirectory: string): Promise<void> {
    tl.debug(`Preparing output directory: ${outputDirectory}`);
    
    // Create output directory if it doesn't exist
    if (!tl.exist(outputDirectory)) {
        tl.mkdirP(outputDirectory);
        tl.debug(`✓ Created output directory: ${outputDirectory}`);
    } else {
        tl.debug(`✓ Output directory already exists: ${outputDirectory}`);
    }
    
    // Verify it's writable by creating a test file
    const testFile = path.join(outputDirectory, '.write-test');
    try {
        tl.writeFile(testFile, 'test');
        // Clean up test file
        if (tl.exist(testFile)) {
            // Note: In real implementation, you'd use proper file deletion
            tl.debug('✓ Output directory is writable');
        }
    } catch (error) {
        throw new Error(`Output directory is not writable: ${outputDirectory}`);
    }
}

/**
 * Processes files in the source directory
 */
async function processSourceFiles(inputs: TaskInputs): Promise<string[]> {
    tl.debug(`Processing files in: ${inputs.sourceDirectory}`);
    
    const processedFiles: string[] = [];
    
    try {
        // Get all files in source directory (simple example)
        const files = getFilesInDirectory(inputs.sourceDirectory);
        
        tl.debug(`Found ${files.length} files to process`);
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileName = path.basename(file);
            
            // Report progress
            const progress = Math.round(((i + 1) / files.length) * 100);
            console.log(`##vso[task.setprogress value=${progress}]Processing ${fileName} (${i + 1}/${files.length})`);
            
            try {
                await processFile(file, inputs);
                processedFiles.push(file);
                tl.debug(`✓ Processed: ${fileName}`);
            } catch (error) {
                tl.warning(`⚠ Failed to process ${fileName}: ${error.message}`);
                if (!inputs.skipOnError) {
                    throw new Error(`Failed to process ${fileName}: ${error.message}`);
                }
            }
        }
        
        tl.debug(`✓ Processed ${processedFiles.length} of ${files.length} files`);
        return processedFiles;
        
    } catch (error) {
        throw new Error(`Error processing source files: ${error.message}`);
    }
}

/**
 * Gets all files in a directory (non-recursive for simplicity)
 */
function getFilesInDirectory(directory: string): string[] {
    const files: string[] = [];
    
    try {
        // Use ls command to get directory contents
        const lsOutput = tl.ls('-A', [directory]);
        const entries = lsOutput.split('\n').filter(entry => entry.trim() !== '');
        
        for (const entry of entries) {
            const fullPath = path.join(directory, entry);
            if (tl.exist(fullPath) && tl.stats(fullPath).isFile()) {
                files.push(fullPath);
            }
        }
        
        return files;
    } catch (error) {
        throw new Error(`Failed to list files in directory ${directory}: ${error.message}`);
    }
}

/**
 * Processes a single file
 */
async function processFile(filePath: string, inputs: TaskInputs): Promise<void> {
    const fileName = path.basename(filePath);
    const outputPath = path.join(inputs.outputDirectory, `processed_${fileName}`);
    
    tl.debug(`Processing file: ${fileName}`);
    
    try {
        // Read source file
        const stats = tl.stats(filePath);
        tl.debug(`File size: ${stats.size} bytes`);
        
        // For this example, we'll just copy the file with a prefix
        // In a real task, you'd perform actual processing
        tl.cp(filePath, outputPath);
        
        tl.debug(`✓ File processed: ${fileName} -> ${path.basename(outputPath)}`);
        
    } catch (error) {
        throw new Error(`Failed to process file ${fileName}: ${error.message}`);
    }
}

/**
 * Generates a summary of the task execution
 */
async function generateTaskSummary(inputs: TaskInputs, processedFiles: string[]): Promise<void> {
    tl.debug('Generating task summary...');
    
    const summaryContent = `# Task Execution Summary

## Configuration
- **Source Directory**: ${inputs.sourceDirectory}
- **Output Directory**: ${inputs.outputDirectory}
- **Build Configuration**: ${inputs.buildConfiguration}
- **Verbose Logging**: ${inputs.enableVerboseLogging}
- **Timeout**: ${inputs.timeout} seconds
- **Skip on Error**: ${inputs.skipOnError}

## Results
- **Files Processed**: ${processedFiles.length}
- **Execution Time**: ${new Date().toISOString()}

## Processed Files
${processedFiles.map(file => `- ${path.basename(file)}`).join('\n')}

## Environment
- **Agent OS**: ${tl.getVariable('Agent.OS')}
- **Build ID**: ${tl.getVariable('Build.BuildId')}
- **Build Number**: ${tl.getVariable('Build.BuildNumber')}
`;

    // Write summary to output directory
    const summaryPath = path.join(inputs.outputDirectory, 'task-summary.md');
    tl.writeFile(summaryPath, summaryContent);
    
    // Add as attachment for build summary
    tl.addAttachment('task-summary', 'TaskSummary', summaryPath);
    
    tl.debug(`✓ Task summary generated: ${summaryPath}`);
}

// Entry point - run the task
if (require.main === module) {
    run().catch((error) => {
        tl.error(`Unhandled error in task execution: ${error}`);
        tl.setResult(tl.TaskResult.Failed, 'Unhandled error in task execution');
        process.exit(1);
    });
}

// Export for testing
export { run, getTaskInputs, validateInputs, executeMainTask };