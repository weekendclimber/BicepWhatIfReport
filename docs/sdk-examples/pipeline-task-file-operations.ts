/**
 * File Operations Pipeline Task Example
 * 
 * This example demonstrates comprehensive file operations using azure-pipelines-task-lib,
 * including file discovery, manipulation, copying, and artifact management.
 * 
 * Features demonstrated:
 * - File discovery with pattern matching
 * - File reading and writing operations
 * - Directory operations (create, copy, move)
 * - File validation and integrity checking
 * - Artifact and attachment management
 * - Progress reporting for long operations
 * - Error handling for file operations
 */

import tl = require('azure-pipelines-task-lib/task');
import * as path from 'path';
import * as fs from 'fs';

// Interface for task configuration
interface FileTaskInputs {
    sourceDirectory: string;
    outputDirectory: string;
    filePattern: string;
    includeSubdirectories: boolean;
    createBackup: boolean;
    validateFiles: boolean;
    compressionLevel: string;
}

// Interface for file processing results
interface FileProcessingResult {
    originalPath: string;
    outputPath: string;
    size: number;
    checksum?: string;
    processingTime: number;
}

/**
 * Main task execution function
 */
async function run(): Promise<void> {
    try {
        console.log('Starting File Operations Pipeline Task...');
        
        // Get and validate inputs
        const inputs = getTaskInputs();
        if (!validateInputs(inputs)) {
            return;
        }
        
        // Create output directory structure
        await setupOutputDirectories(inputs);
        
        // Discover files to process
        const filesToProcess = await discoverFiles(inputs);
        console.log(`Found ${filesToProcess.length} files matching pattern: ${inputs.filePattern}`);
        
        if (filesToProcess.length === 0) {
            tl.setResult(tl.TaskResult.Succeeded, 'No files found matching the specified pattern');
            return;
        }
        
        // Process files
        const results = await processFiles(filesToProcess, inputs);
        
        // Generate artifacts and attachments
        await generateArtifacts(results, inputs);
        
        // Report success
        const message = `Successfully processed ${results.length} files`;
        tl.setResult(tl.TaskResult.Succeeded, message);
        console.log(message);
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        tl.error(`Task failed: ${errorMessage}`);
        tl.setResult(tl.TaskResult.Failed, errorMessage);
    }
}

/**
 * Retrieves and parses task inputs
 */
function getTaskInputs(): FileTaskInputs {
    tl.debug('Retrieving file operations task inputs...');
    
    return {
        sourceDirectory: tl.getInputRequired('sourceDirectory'),
        outputDirectory: tl.getInputRequired('outputDirectory'),
        filePattern: tl.getInput('filePattern') || '**/*',
        includeSubdirectories: tl.getBoolInput('includeSubdirectories', true),
        createBackup: tl.getBoolInput('createBackup', false),
        validateFiles: tl.getBoolInput('validateFiles', true),
        compressionLevel: tl.getInput('compressionLevel') || 'normal'
    };
}

/**
 * Validates task inputs
 */
function validateInputs(inputs: FileTaskInputs): boolean {
    tl.debug('Validating file operations inputs...');
    
    // Validate source directory
    if (!tl.exist(inputs.sourceDirectory)) {
        tl.setResult(tl.TaskResult.Failed, `Source directory does not exist: ${inputs.sourceDirectory}`);
        return false;
    }
    
    if (!tl.stats(inputs.sourceDirectory).isDirectory()) {
        tl.setResult(tl.TaskResult.Failed, `Source path is not a directory: ${inputs.sourceDirectory}`);
        return false;
    }
    
    // Validate compression level
    const validCompressionLevels = ['none', 'fast', 'normal', 'maximum'];
    if (!validCompressionLevels.includes(inputs.compressionLevel)) {
        tl.setResult(
            tl.TaskResult.Failed, 
            `Invalid compression level: ${inputs.compressionLevel}. Valid values: ${validCompressionLevels.join(', ')}`
        );
        return false;
    }
    
    // Validate file pattern
    if (!inputs.filePattern || inputs.filePattern.trim() === '') {
        tl.setResult(tl.TaskResult.Failed, 'File pattern cannot be empty');
        return false;
    }
    
    tl.debug('✓ All inputs validated successfully');
    return true;
}

/**
 * Sets up the output directory structure
 */
async function setupOutputDirectories(inputs: FileTaskInputs): Promise<void> {
    tl.debug('Setting up output directories...');
    
    try {
        // Create main output directory
        if (!tl.exist(inputs.outputDirectory)) {
            tl.mkdirP(inputs.outputDirectory);
            tl.debug(`✓ Created output directory: ${inputs.outputDirectory}`);
        }
        
        // Create subdirectories
        const subdirs = ['processed', 'logs', 'temp'];
        if (inputs.createBackup) {
            subdirs.push('backup');
        }
        
        for (const subdir of subdirs) {
            const subdirPath = path.join(inputs.outputDirectory, subdir);
            if (!tl.exist(subdirPath)) {
                tl.mkdirP(subdirPath);
                tl.debug(`✓ Created subdirectory: ${subdir}`);
            }
        }
        
        // Test write permissions
        const testFile = path.join(inputs.outputDirectory, '.write-test');
        tl.writeFile(testFile, 'test');
        
        // Cleanup test file
        if (tl.exist(testFile)) {
            // In a real implementation, you'd properly delete the file
            tl.debug('✓ Output directory is writable');
        }
        
    } catch (error) {
        throw new Error(`Failed to setup output directories: ${error.message}`);
    }
}

/**
 * Discovers files matching the specified pattern
 */
async function discoverFiles(inputs: FileTaskInputs): Promise<string[]> {
    tl.debug(`Discovering files with pattern: ${inputs.filePattern}`);
    
    try {
        const files: string[] = [];
        
        // Start discovery from source directory
        await discoverFilesRecursive(inputs.sourceDirectory, inputs, files);
        
        // Sort files for consistent processing order
        files.sort();
        
        tl.debug(`✓ Discovered ${files.length} files`);
        return files;
        
    } catch (error) {
        throw new Error(`Failed to discover files: ${error.message}`);
    }
}

/**
 * Recursively discovers files in directories
 */
async function discoverFilesRecursive(
    directory: string, 
    inputs: FileTaskInputs, 
    files: string[]
): Promise<void> {
    
    try {
        const entries = await fs.promises.readdir(directory, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(directory, entry.name);
            
            if (entry.isFile()) {
                // Check if file matches pattern (simplified pattern matching)
                if (matchesPattern(entry.name, inputs.filePattern)) {
                    files.push(fullPath);
                    tl.debug(`Found matching file: ${fullPath}`);
                }
            } else if (entry.isDirectory() && inputs.includeSubdirectories) {
                // Recursively search subdirectories
                await discoverFilesRecursive(fullPath, inputs, files);
            }
        }
        
    } catch (error) {
        tl.warning(`Failed to read directory ${directory}: ${error.message}`);
    }
}

/**
 * Simple pattern matching (in real implementation, you might use glob patterns)
 */
function matchesPattern(fileName: string, pattern: string): boolean {
    if (pattern === '**/*' || pattern === '*') {
        return true;
    }
    
    // Simple extension matching
    if (pattern.startsWith('*.')) {
        const extension = pattern.substring(2);
        return fileName.endsWith(`.${extension}`);
    }
    
    // Exact name matching
    if (!pattern.includes('*')) {
        return fileName === pattern;
    }
    
    // Convert simple wildcards to regex
    const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*');
    
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(fileName);
}

/**
 * Processes all discovered files
 */
async function processFiles(
    filePaths: string[], 
    inputs: FileTaskInputs
): Promise<FileProcessingResult[]> {
    
    tl.debug(`Processing ${filePaths.length} files...`);
    const results: FileProcessingResult[] = [];
    
    for (let i = 0; i < filePaths.length; i++) {
        const filePath = filePaths[i];
        const fileName = path.basename(filePath);
        
        // Report progress
        const progress = Math.round(((i + 1) / filePaths.length) * 100);
        console.log(`##vso[task.setprogress value=${progress}]Processing ${fileName} (${i + 1}/${filePaths.length})`);
        
        try {
            const startTime = Date.now();
            const result = await processFile(filePath, inputs);
            const processingTime = Date.now() - startTime;
            
            results.push({
                ...result,
                processingTime
            });
            
            tl.debug(`✓ Processed ${fileName} in ${processingTime}ms`);
            
        } catch (error) {
            tl.warning(`⚠ Failed to process ${fileName}: ${error.message}`);
            // Continue processing other files
        }
    }
    
    tl.debug(`✓ Successfully processed ${results.length} of ${filePaths.length} files`);
    return results;
}

/**
 * Processes a single file
 */
async function processFile(
    filePath: string, 
    inputs: FileTaskInputs
): Promise<FileProcessingResult> {
    
    const fileName = path.basename(filePath);
    const stats = tl.stats(filePath);
    
    tl.debug(`Processing file: ${fileName} (${stats.size} bytes)`);
    
    try {
        // Create backup if requested
        if (inputs.createBackup) {
            await createBackup(filePath, inputs.outputDirectory);
        }
        
        // Validate file if requested
        let checksum: string | undefined;
        if (inputs.validateFiles) {
            checksum = await calculateFileChecksum(filePath);
        }
        
        // Process the file (example: copy with transformation)
        const outputPath = await transformFile(filePath, inputs);
        
        return {
            originalPath: filePath,
            outputPath: outputPath,
            size: stats.size,
            checksum: checksum,
            processingTime: 0 // Will be set by caller
        };
        
    } catch (error) {
        throw new Error(`Failed to process ${fileName}: ${error.message}`);
    }
}

/**
 * Creates a backup of the original file
 */
async function createBackup(filePath: string, outputDirectory: string): Promise<void> {
    const fileName = path.basename(filePath);
    const backupDir = path.join(outputDirectory, 'backup');
    const backupPath = path.join(backupDir, `${fileName}.backup`);
    
    try {
        tl.cp(filePath, backupPath);
        tl.debug(`✓ Created backup: ${backupPath}`);
    } catch (error) {
        throw new Error(`Failed to create backup for ${fileName}: ${error.message}`);
    }
}

/**
 * Calculates file checksum for validation
 */
async function calculateFileChecksum(filePath: string): Promise<string> {
    try {
        // Simple checksum calculation (in real implementation, use crypto.createHash)
        const content = await fs.promises.readFile(filePath);
        let checksum = 0;
        for (let i = 0; i < content.length; i++) {
            checksum = (checksum + content[i]) % 65536;
        }
        return checksum.toString(16).padStart(4, '0');
    } catch (error) {
        throw new Error(`Failed to calculate checksum: ${error.message}`);
    }
}

/**
 * Transforms/processes the file and saves to output directory
 */
async function transformFile(filePath: string, inputs: FileTaskInputs): Promise<string> {
    const fileName = path.basename(filePath);
    const processedDir = path.join(inputs.outputDirectory, 'processed');
    const outputPath = path.join(processedDir, fileName);
    
    try {
        // For this example, we'll just copy the file
        // In a real implementation, you might:
        // - Transform file content
        // - Apply compression
        // - Convert file formats
        // - Apply filters or validations
        
        tl.cp(filePath, outputPath);
        
        tl.debug(`✓ Transformed file: ${fileName} -> ${outputPath}`);
        return outputPath;
        
    } catch (error) {
        throw new Error(`Failed to transform ${fileName}: ${error.message}`);
    }
}

/**
 * Generates artifacts and attachments from processing results
 */
async function generateArtifacts(
    results: FileProcessingResult[], 
    inputs: FileTaskInputs
): Promise<void> {
    
    tl.debug('Generating artifacts and attachments...');
    
    try {
        // Generate processing report
        const reportPath = await generateProcessingReport(results, inputs);
        
        // Add report as attachment
        tl.addAttachment('file-processing-report', 'ProcessingReport', reportPath);
        
        // Upload processed files as artifacts
        const processedDir = path.join(inputs.outputDirectory, 'processed');
        if (tl.exist(processedDir) && results.length > 0) {
            tl.uploadArtifact('processed-files', processedDir, 'ProcessedFiles');
            tl.debug('✓ Uploaded processed files as artifacts');
        }
        
        // Upload logs as artifacts
        const logsDir = path.join(inputs.outputDirectory, 'logs');
        if (tl.exist(logsDir)) {
            tl.uploadArtifact('logs', logsDir, 'ProcessingLogs');
            tl.debug('✓ Uploaded logs as artifacts');
        }
        
        // Set output variables for subsequent tasks
        tl.setVariable('ProcessedFileCount', results.length.toString());
        tl.setVariable('OutputDirectory', inputs.outputDirectory);
        tl.setVariable('ProcessingReportPath', reportPath);
        
        tl.debug('✓ Generated all artifacts and attachments');
        
    } catch (error) {
        tl.warning(`Failed to generate artifacts: ${error.message}`);
    }
}

/**
 * Generates a detailed processing report
 */
async function generateProcessingReport(
    results: FileProcessingResult[], 
    inputs: FileTaskInputs
): Promise<string> {
    
    const totalSize = results.reduce((sum, result) => sum + result.size, 0);
    const totalTime = results.reduce((sum, result) => sum + result.processingTime, 0);
    const avgTime = results.length > 0 ? totalTime / results.length : 0;
    
    const reportContent = `# File Processing Report

## Summary
- **Files Processed**: ${results.length}
- **Total Size**: ${formatFileSize(totalSize)}
- **Total Processing Time**: ${totalTime}ms
- **Average Processing Time**: ${avgTime.toFixed(2)}ms per file
- **Processing Date**: ${new Date().toISOString()}

## Configuration
- **Source Directory**: ${inputs.sourceDirectory}
- **Output Directory**: ${inputs.outputDirectory}
- **File Pattern**: ${inputs.filePattern}
- **Include Subdirectories**: ${inputs.includeSubdirectories}
- **Create Backup**: ${inputs.createBackup}
- **Validate Files**: ${inputs.validateFiles}
- **Compression Level**: ${inputs.compressionLevel}

## Processing Results

| File | Size | Processing Time | Checksum | Status |
|------|------|-----------------|----------|--------|
${results.map(result => {
    const fileName = path.basename(result.originalPath);
    const size = formatFileSize(result.size);
    const checksum = result.checksum || 'N/A';
    return `| ${fileName} | ${size} | ${result.processingTime}ms | ${checksum} | ✓ Success |`;
}).join('\n')}

## Environment Information
- **Agent OS**: ${tl.getVariable('Agent.OS')}
- **Build ID**: ${tl.getVariable('Build.BuildId')}
- **Build Number**: ${tl.getVariable('Build.BuildNumber')}
- **Working Directory**: ${tl.getVariable('System.DefaultWorkingDirectory')}

---
*Report generated by File Operations Pipeline Task*
`;
    
    const reportPath = path.join(inputs.outputDirectory, 'file-processing-report.md');
    tl.writeFile(reportPath, reportContent);
    
    tl.debug(`✓ Generated processing report: ${reportPath}`);
    return reportPath;
}

/**
 * Formats file size in human-readable format
 */
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const unitIndex = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, unitIndex);
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// Entry point
if (require.main === module) {
    run().catch((error) => {
        tl.error(`Unhandled error in file operations task: ${error}`);
        tl.setResult(tl.TaskResult.Failed, 'Unhandled error in file operations task');
        process.exit(1);
    });
}

// Export functions for testing
export { 
    run, 
    getTaskInputs, 
    validateInputs, 
    discoverFiles, 
    processFiles, 
    generateArtifacts 
};