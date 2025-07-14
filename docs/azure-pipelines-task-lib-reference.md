# Azure Pipelines Task Library (azure-pipelines-task-lib) - Complete Reference Guide

Complete documentation for the Azure Pipelines Task Library version 5.2.1, used for creating custom Azure DevOps pipeline tasks.

## 📚 Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Core Methods](#core-methods)
4. [Input & Output Management](#input--output-management)
5. [Variable Management](#variable-management)
6. [Logging & Debugging](#logging--debugging)
7. [Task Results & Error Handling](#task-results--error-handling)
8. [File & Path Operations](#file--path-operations)
9. [Artifact & Attachment Management](#artifact--attachment-management)
10. [Service Connections & Authentication](#service-connections--authentication)
11. [Environment & Platform Detection](#environment--platform-detection)
12. [Advanced Features](#advanced-features)
13. [Best Practices](#best-practices)
14. [Common Patterns](#common-patterns)

## Overview

The Azure Pipelines Task Library (`azure-pipelines-task-lib`) is the official library for creating custom Azure DevOps pipeline tasks. It provides a comprehensive API for interacting with the Azure DevOps agent environment, handling inputs/outputs, managing files, and communicating task results.

### Key Features
- **Input/Output Handling**: Retrieve task inputs and set outputs
- **Variable Management**: Access and set pipeline variables
- **Logging**: Debug, info, warning, and error logging
- **File Operations**: Path manipulation and file system operations
- **Artifact Management**: Upload and manage build artifacts
- **Service Connections**: Access service connection endpoints
- **Cross-Platform**: Works on Windows, macOS, and Linux agents

### Import Pattern
```typescript
import tl = require('azure-pipelines-task-lib/task');
```

## Installation

```bash
npm install azure-pipelines-task-lib
```

### TypeScript Support
```bash
npm install @types/node  # Required for Node.js types
```

## Core Methods

### `tl.debug(message: string): void`
Writes a debug message to the task log (only visible when `system.debug` is true).

```typescript
tl.debug('Processing configuration file...');
tl.debug(`Current working directory: ${process.cwd()}`);
```

### `tl.warning(message: string): void`
Writes a warning message to the task log.

```typescript
tl.warning('Configuration file not found, using defaults');
tl.warning(`Deprecated parameter '${paramName}' will be removed in future versions`);
```

### `tl.error(message: string): void`
Writes an error message to the task log.

```typescript
tl.error('Failed to connect to service endpoint');
tl.error(`Invalid input value: ${inputValue}`);
```

## Input & Output Management

### Getting Task Inputs

#### `tl.getInput(name: string, required?: boolean): string | undefined`
Retrieves a task input value.

```typescript
// Required input
const sourceDirectory = tl.getInput('sourceDirectory', true);
if (!sourceDirectory) {
    tl.setResult(tl.TaskResult.Failed, 'Source directory is required');
    return;
}

// Optional input with default
const buildConfiguration = tl.getInput('buildConfiguration') || 'Release';

// Boolean input
const enableLogging = tl.getBoolInput('enableLogging');

// Number input
const timeoutMinutes = tl.getInputRequired('timeoutMinutes');
const timeout = parseInt(timeoutMinutes) * 60 * 1000; // Convert to milliseconds
```

#### `tl.getBoolInput(name: string, required?: boolean): boolean`
Retrieves a boolean input value.

```typescript
const skipTests = tl.getBoolInput('skipTests');
const forcePush = tl.getBoolInput('forcePush', false); // Optional, defaults to false
```

#### `tl.getDelimitedInput(name: string, delim: string, required?: boolean): string[]`
Retrieves a delimited input as an array.

```typescript
// Input: "file1.txt,file2.txt,file3.txt"
const files = tl.getDelimitedInput('files', ',', true);
// Result: ['file1.txt', 'file2.txt', 'file3.txt']

// Multi-line input
const commands = tl.getDelimitedInput('commands', '\n');
```

#### `tl.getInputRequired(name: string): string`
Retrieves a required input, throws if not provided.

```typescript
try {
    const apiKey = tl.getInputRequired('apiKey');
    // Process with apiKey
} catch (error) {
    tl.setResult(tl.TaskResult.Failed, `Required input missing: ${error.message}`);
}
```

### Setting Task Outputs

#### `tl.setVariable(name: string, val: string, secret?: boolean): void`
Sets a variable that can be used by subsequent tasks.

```typescript
// Set a regular variable
tl.setVariable('BuildNumber', '1.0.0.123');

// Set a secret variable (masked in logs)
tl.setVariable('ApiToken', tokenValue, true);

// Set output variable for other tasks
tl.setVariable('OutputPath', outputDirectory);
```

## Variable Management

### Getting Variables

#### `tl.getVariable(name: string): string | undefined`
Retrieves a pipeline variable value.

```typescript
// System variables
const buildId = tl.getVariable('Build.BuildId');
const sourceBranch = tl.getVariable('Build.SourceBranch');
const agentOS = tl.getVariable('Agent.OS');

// Custom variables
const customConfig = tl.getVariable('MyCustomConfig') || 'default-value';

// Environment variables
const path = tl.getVariable('PATH');
```

### Common System Variables

```typescript
// Build information
const buildDefinitionName = tl.getVariable('Build.DefinitionName');
const buildNumber = tl.getVariable('Build.BuildNumber');
const buildReason = tl.getVariable('Build.Reason');
const buildSourceVersion = tl.getVariable('Build.SourceVersion');

// Repository information
const repoName = tl.getVariable('Build.Repository.Name');
const repoUri = tl.getVariable('Build.Repository.Uri');

// Agent information
const agentName = tl.getVariable('Agent.Name');
const agentWorkFolder = tl.getVariable('Agent.WorkFolder');
const agentTempDirectory = tl.getVariable('Agent.TempDirectory');

// Directory paths
const defaultWorkingDirectory = tl.getVariable('System.DefaultWorkingDirectory');
const artifactStagingDirectory = tl.getVariable('Build.ArtifactStagingDirectory');
const binariesDirectory = tl.getVariable('Build.BinariesDirectory');
```

## Logging & Debugging

### Log Levels

```typescript
// Debug (only shown when system.debug=true)
tl.debug('Detailed debugging information');

// Info (default log level)
console.log('General information');

// Warning
tl.warning('Something might be wrong but task can continue');

// Error
tl.error('Something went wrong but task might still succeed');
```

### Structured Logging

```typescript
// Log with context
tl.debug(`Processing file: ${fileName} (${index + 1}/${totalFiles})`);

// Log objects (convert to JSON)
const config = { timeout: 30, retries: 3 };
tl.debug(`Configuration: ${JSON.stringify(config, null, 2)}`);

// Performance logging
const startTime = Date.now();
// ... do work ...
const duration = Date.now() - startTime;
tl.debug(`Operation completed in ${duration}ms`);
```

## Task Results & Error Handling

### Task Results

#### `tl.setResult(result: TaskResult, message: string): void`
Sets the task result and completion message.

```typescript
// Success
tl.setResult(tl.TaskResult.Succeeded, 'Task completed successfully');

// Failure
tl.setResult(tl.TaskResult.Failed, 'Task failed due to invalid configuration');

// Success with issues (warnings)
tl.setResult(tl.TaskResult.SucceededWithIssues, 'Task completed with warnings');

// Cancelled
tl.setResult(tl.TaskResult.Cancelled, 'Task was cancelled by user');

// Skipped
tl.setResult(tl.TaskResult.Skipped, 'Task was skipped due to conditions');
```

### Error Handling Patterns

```typescript
async function runTask() {
    try {
        // Validate inputs
        const inputValue = tl.getInput('inputValue', true);
        if (!inputValue) {
            tl.setResult(tl.TaskResult.Failed, 'Required input is missing');
            return;
        }

        // Validate file paths
        if (!tl.exist(inputValue)) {
            tl.setResult(tl.TaskResult.Failed, `File does not exist: ${inputValue}`);
            return;
        }

        // Perform work
        await doWork(inputValue);

        // Success
        tl.setResult(tl.TaskResult.Succeeded, 'Task completed successfully');

    } catch (error) {
        // Handle different error types
        if (error instanceof Error) {
            tl.error(`Task failed: ${error.message}`);
            tl.setResult(tl.TaskResult.Failed, error.message);
        } else {
            tl.error(`Unknown error: ${error}`);
            tl.setResult(tl.TaskResult.Failed, 'Unknown error occurred');
        }
    }
}

// Graceful error handling with cleanup
async function runTaskWithCleanup() {
    let tempDir: string | null = null;
    
    try {
        tempDir = tl.getVariable('Agent.TempDirectory');
        // ... do work ...
        
    } catch (error) {
        tl.error(`Task failed: ${error.message}`);
        tl.setResult(tl.TaskResult.Failed, error.message);
    } finally {
        // Cleanup
        if (tempDir && tl.exist(tempDir)) {
            tl.debug(`Cleaning up temporary directory: ${tempDir}`);
            // Cleanup logic here
        }
    }
}
```

## File & Path Operations

### Path Utilities

#### `tl.resolve(folderPath: string, ...paths: string[]): string`
Resolves paths relative to a folder.

```typescript
const workingDir = tl.getVariable('System.DefaultWorkingDirectory');
const configFile = tl.resolve(workingDir, 'config', 'settings.json');
const buildOutput = tl.resolve(workingDir, 'bin', 'Release');
```

#### `tl.exist(path: string): boolean`
Checks if a file or directory exists.

```typescript
const configPath = tl.getInput('configPath', true);
if (!tl.exist(configPath)) {
    tl.setResult(tl.TaskResult.Failed, `Configuration file not found: ${configPath}`);
    return;
}

// Check for optional files
const optionalConfig = tl.getInput('optionalConfigPath');
if (optionalConfig && tl.exist(optionalConfig)) {
    tl.debug(`Loading optional configuration: ${optionalConfig}`);
    // Load optional config
}
```

#### `tl.stats(path: string): fs.Stats`
Gets file system statistics.

```typescript
const filePath = tl.getInput('inputFile', true);
if (tl.exist(filePath)) {
    const stats = tl.stats(filePath);
    
    if (stats.isDirectory()) {
        tl.debug(`Input is a directory: ${filePath}`);
    } else if (stats.isFile()) {
        tl.debug(`Input file size: ${stats.size} bytes`);
        tl.debug(`Last modified: ${stats.mtime}`);
    }
}
```

### File Operations

#### `tl.writeFile(file: string, data: string | Buffer): void`
Writes content to a file.

```typescript
// Write text file
const reportContent = generateReport();
const reportPath = tl.resolve(tl.getVariable('Build.ArtifactStagingDirectory'), 'report.md');
tl.writeFile(reportPath, reportContent);

// Write JSON file
const config = { version: '1.0', settings: {} };
const configPath = tl.resolve(tl.getVariable('Agent.TempDirectory'), 'config.json');
tl.writeFile(configPath, JSON.stringify(config, null, 2));
```

#### `tl.cp(source: string, dest: string, options?: string): void`
Copies files or directories.

```typescript
const sourceDir = tl.getInput('sourceDirectory', true);
const targetDir = tl.resolve(tl.getVariable('Build.ArtifactStagingDirectory'), 'output');

// Copy single file
tl.cp(tl.resolve(sourceDir, 'important.txt'), tl.resolve(targetDir, 'important.txt'));

// Copy directory recursively
tl.cp(sourceDir, targetDir, '-r');

// Copy with force overwrite
tl.cp(sourceDir, targetDir, '-rf');
```

#### `tl.mv(source: string, dest: string): void`
Moves files or directories.

```typescript
const tempFile = tl.resolve(tl.getVariable('Agent.TempDirectory'), 'temp.txt');
const finalFile = tl.resolve(tl.getVariable('Build.ArtifactStagingDirectory'), 'output.txt');
tl.mv(tempFile, finalFile);
```

### Directory Operations

#### `tl.mkdirP(path: string): void`
Creates directories recursively.

```typescript
const outputDir = tl.resolve(tl.getVariable('Build.ArtifactStagingDirectory'), 'reports', 'detailed');
tl.mkdirP(outputDir);
tl.debug(`Created directory: ${outputDir}`);
```

#### `tl.find(findPath: string, options?: FindOptions): string[]`
Recursively finds all paths in a given directory (cross-platform).

```typescript
const sourceDir = tl.getInput('sourceDirectory', true);

// Find all files and directories recursively
const allPaths = tl.find(sourceDir);
tl.debug(`All paths found: ${allPaths.length}`);

// Filter to get only files
const files = allPaths.filter(p => tl.exist(p) && tl.stats(p).isFile());
tl.debug(`Files found: ${files.join('\n')}`);

// Find with custom options
const paths = tl.find(sourceDir, { followSymbolicLinks: false });
```

#### Directory Listing Alternatives

For directory listing, prefer the above `tl.find()` method or Node.js built-ins:

```typescript
import * as fs from 'fs';
import * as path from 'path';

const sourceDir = tl.getInput('sourceDirectory', true);

// Use Node.js for simple directory listing
const entries = fs.readdirSync(sourceDir);
const files = entries.filter(entry => {
    const fullPath = path.join(sourceDir, entry);
    return fs.statSync(fullPath).isFile();
});

// Or use async version
const entriesAsync = await fs.promises.readdir(sourceDir);
```

> **Note**: `tl.ls()` is available but may not work consistently across all platforms (Windows/Linux/macOS). Use `tl.find()` or Node.js built-ins for reliable cross-platform behavior.

## Artifact & Attachment Management

### Uploading Artifacts

#### `tl.uploadArtifact(containerFolder: string, folderPath: string, artifactName: string): void`
Uploads files as build artifacts.

```typescript
const artifactStagingDir = tl.getVariable('Build.ArtifactStagingDirectory');
const reportDir = tl.resolve(artifactStagingDir, 'reports');

// Ensure directory exists and has content
if (tl.exist(reportDir)) {
    tl.uploadArtifact('drop', reportDir, 'BuildReports');
    tl.debug(`Uploaded artifacts from: ${reportDir}`);
} else {
    tl.warning('No artifacts to upload - reports directory is empty');
}

// Upload specific files
const logFile = tl.resolve(artifactStagingDir, 'build.log');
if (tl.exist(logFile)) {
    tl.uploadArtifact('logs', artifactStagingDir, 'BuildLogs');
}
```

### Managing Attachments

#### `tl.addAttachment(type: string, name: string, filePath: string): void`
Adds file attachments to the build summary.

```typescript
const ATTACHMENT_TYPE = 'myCustomReport';

// Add single attachment
const reportPath = tl.resolve(tl.getVariable('Build.ArtifactStagingDirectory'), 'report.html');
if (tl.exist(reportPath)) {
    tl.addAttachment(ATTACHMENT_TYPE, 'BuildReport', reportPath);
}

// Add multiple attachments
const reportFiles = ['summary.html', 'details.html', 'errors.html'];
reportFiles.forEach((fileName, index) => {
    const filePath = tl.resolve(tl.getVariable('Build.ArtifactStagingDirectory'), fileName);
    if (tl.exist(filePath)) {
        const attachmentName = `Report_${index + 1}_${fileName}`;
        tl.addAttachment(ATTACHMENT_TYPE, attachmentName, filePath);
    }
});
```

### Attachment Name Escaping

```typescript
function escapeAttachmentName(name: string): string {
    // Escape special characters for attachment names
    const ESCAPED_CHARACTERS = '<>|:*?\\/ ';
    const ESCAPE_CHARACTER = '^';
    
    let escaped = name;
    const chars = ESCAPE_CHARACTER + ESCAPED_CHARACTERS;
    
    for (let i = 0; i < chars.length; i++) {
        const num = `${i}`.padStart(2, '0');
        escaped = escaped.split(chars[i]).join(`${ESCAPE_CHARACTER}${num}`);
    }
    
    return escaped;
}

// Usage
const fileName = 'My Report: File #1.html';
const safeName = escapeAttachmentName(fileName);
tl.addAttachment('report', safeName, filePath);
```

## Service Connections & Authentication

### Getting Service Connection Details

#### `tl.getEndpointUrl(id: string, optional?: boolean): string`
Gets the URL from a service connection.

```typescript
const serviceConnection = tl.getInput('serviceConnection', true);
const serviceUrl = tl.getEndpointUrl(serviceConnection, false);
tl.debug(`Service URL: ${serviceUrl}`);
```

#### `tl.getEndpointDataParameter(id: string, key: string, optional?: boolean): string`
Gets custom data from a service connection.

```typescript
const serviceConnection = tl.getInput('serviceConnection', true);
const apiVersion = tl.getEndpointDataParameter(serviceConnection, 'ApiVersion', false);
const timeout = tl.getEndpointDataParameter(serviceConnection, 'Timeout', true) || '30';
```

#### `tl.getEndpointAuthorizationParameter(id: string, key: string, optional?: boolean): string`
Gets authorization parameters from a service connection.

```typescript
const serviceConnection = tl.getInput('serviceConnection', true);

// For username/password auth
const username = tl.getEndpointAuthorizationParameter(serviceConnection, 'username', false);
const password = tl.getEndpointAuthorizationParameter(serviceConnection, 'password', false);

// For token-based auth
const token = tl.getEndpointAuthorizationParameter(serviceConnection, 'apitoken', false);

// For certificate auth
const clientCert = tl.getEndpointAuthorizationParameter(serviceConnection, 'clientcert', true);
```

### Authentication Patterns

```typescript
interface ServiceConfig {
    url: string;
    username?: string;
    password?: string;
    token?: string;
    timeout: number;
}

function getServiceConfig(): ServiceConfig {
    const serviceConnection = tl.getInput('serviceConnection', true);
    
    const config: ServiceConfig = {
        url: tl.getEndpointUrl(serviceConnection, false),
        timeout: parseInt(tl.getEndpointDataParameter(serviceConnection, 'Timeout', true) || '30')
    };
    
    // Try token auth first
    const token = tl.getEndpointAuthorizationParameter(serviceConnection, 'apitoken', true);
    if (token) {
        config.token = token;
        tl.debug('Using token-based authentication');
    } else {
        // Fall back to username/password
        config.username = tl.getEndpointAuthorizationParameter(serviceConnection, 'username', false);
        config.password = tl.getEndpointAuthorizationParameter(serviceConnection, 'password', false);
        tl.debug('Using username/password authentication');
    }
    
    return config;
}
```

## Environment & Platform Detection

### Platform Detection

```typescript
function getPlatformInfo() {
    const agentOS = tl.getVariable('Agent.OS');
    const isWindows = agentOS === 'Windows_NT';
    const isMacOS = agentOS === 'Darwin';
    const isLinux = agentOS === 'Linux';
    
    tl.debug(`Running on: ${agentOS}`);
    
    return { agentOS, isWindows, isMacOS, isLinux };
}

// Platform-specific operations
function getExecutableName(baseName: string): string {
    const { isWindows } = getPlatformInfo();
    return isWindows ? `${baseName}.exe` : baseName;
}

function getNativePathSeparator(): string {
    const { isWindows } = getPlatformInfo();
    return isWindows ? '\\' : '/';
}
```

### Environment Information

```typescript
function logEnvironmentInfo() {
    // Agent information
    tl.debug(`Agent Name: ${tl.getVariable('Agent.Name')}`);
    tl.debug(`Agent Version: ${tl.getVariable('Agent.Version')}`);
    tl.debug(`Agent OS: ${tl.getVariable('Agent.OS')}`);
    tl.debug(`Agent Machine Name: ${tl.getVariable('Agent.MachineName')}`);
    
    // Build information
    tl.debug(`Build ID: ${tl.getVariable('Build.BuildId')}`);
    tl.debug(`Build Number: ${tl.getVariable('Build.BuildNumber')}`);
    tl.debug(`Build Reason: ${tl.getVariable('Build.Reason')}`);
    
    // Repository information
    tl.debug(`Repository: ${tl.getVariable('Build.Repository.Name')}`);
    tl.debug(`Branch: ${tl.getVariable('Build.SourceBranchName')}`);
    tl.debug(`Commit: ${tl.getVariable('Build.SourceVersion')}`);
    
    // Directory paths
    tl.debug(`Working Directory: ${tl.getVariable('System.DefaultWorkingDirectory')}`);
    tl.debug(`Artifact Staging: ${tl.getVariable('Build.ArtifactStagingDirectory')}`);
    tl.debug(`Temp Directory: ${tl.getVariable('Agent.TempDirectory')}`);
}
```

## Advanced Features

### Conditional Task Execution

```typescript
function shouldExecuteTask(): boolean {
    const buildReason = tl.getVariable('Build.Reason');
    const skipOnPR = tl.getBoolInput('skipOnPullRequest', false);
    
    // Skip on pull request if configured
    if (skipOnPR && buildReason === 'PullRequest') {
        tl.debug('Skipping task execution for pull request');
        return false;
    }
    
    // Skip on certain branches
    const currentBranch = tl.getVariable('Build.SourceBranchName');
    const skipBranches = tl.getDelimitedInput('skipBranches', ',', false);
    
    if (skipBranches && skipBranches.includes(currentBranch)) {
        tl.debug(`Skipping task execution for branch: ${currentBranch}`);
        return false;
    }
    
    return true;
}

// Usage in main task
if (!shouldExecuteTask()) {
    tl.setResult(tl.TaskResult.Skipped, 'Task execution skipped based on conditions');
    return;
}
```

### Progress Reporting

```typescript
async function processFiles(files: string[]) {
    const total = files.length;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = Math.round(((i + 1) / total) * 100);
        
        console.log(`##vso[task.setprogress value=${progress}]Processing file ${i + 1} of ${total}`);
        
        try {
            await processFile(file);
            tl.debug(`✓ Processed: ${file}`);
        } catch (error) {
            tl.warning(`⚠ Failed to process: ${file} - ${error.message}`);
        }
    }
}
```

### Custom Logging Commands

```typescript
// Set build number
function setBuildNumber(buildNumber: string) {
    console.log(`##vso[build.updatebuildnumber]${buildNumber}`);
}

// Add build tag
function addBuildTag(tag: string) {
    console.log(`##vso[build.addbuildtag]${tag}`);
}

// Log issue (appears in build summary)
function logIssue(type: 'warning' | 'error', message: string, file?: string, line?: number) {
    let command = `##vso[task.logissue type=${type}]${message}`;
    if (file) {
        command = `##vso[task.logissue type=${type};sourcepath=${file}`;
        if (line) {
            command += `;linenumber=${line}`;
        }
        command += `]${message}`;
    }
    console.log(command);
}

// Usage
setBuildNumber('1.0.0.123');
addBuildTag('release');
logIssue('warning', 'This is a warning', 'src/file.ts', 42);
```

## Best Practices

### Input Validation

```typescript
function validateInputs(): boolean {
    const requiredInputs = [
        { name: 'sourceDirectory', displayName: 'Source Directory' },
        { name: 'configuration', displayName: 'Build Configuration' },
        { name: 'platform', displayName: 'Target Platform' }
    ];
    
    for (const input of requiredInputs) {
        const value = tl.getInput(input.name, true);
        if (!value || value.trim() === '') {
            tl.setResult(tl.TaskResult.Failed, `${input.displayName} is required`);
            return false;
        }
    }
    
    // Validate file paths
    const sourceDir = tl.getInput('sourceDirectory', true);
    if (!tl.exist(sourceDir)) {
        tl.setResult(tl.TaskResult.Failed, `Source directory does not exist: ${sourceDir}`);
        return false;
    }
    
    if (!tl.stats(sourceDir).isDirectory()) {
        tl.setResult(tl.TaskResult.Failed, `Source path is not a directory: ${sourceDir}`);
        return false;
    }
    
    return true;
}
```

### Error Recovery

```typescript
async function executeWithRetry<T>(
    operation: () => Promise<T>, 
    maxRetries: number = 3, 
    delayMs: number = 1000
): Promise<T> {
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            if (attempt === maxRetries) {
                throw error; // Last attempt failed
            }
            
            tl.warning(`Attempt ${attempt} failed, retrying in ${delayMs}ms: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            delayMs *= 2; // Exponential backoff
        }
    }
    
    throw new Error('This should never be reached');
}

// Usage
try {
    const result = await executeWithRetry(async () => {
        return await callExternalService();
    }, 3, 1000);
    
    tl.setResult(tl.TaskResult.Succeeded, 'Operation completed successfully');
} catch (error) {
    tl.setResult(tl.TaskResult.Failed, `Operation failed after retries: ${error.message}`);
}
```

### Resource Cleanup

```typescript
class TaskExecutor {
    private tempFiles: string[] = [];
    private tempDirs: string[] = [];
    
    async execute() {
        try {
            await this.setupEnvironment();
            await this.performWork();
            tl.setResult(tl.TaskResult.Succeeded, 'Task completed successfully');
            
        } catch (error) {
            tl.error(`Task failed: ${error.message}`);
            tl.setResult(tl.TaskResult.Failed, error.message);
        } finally {
            await this.cleanup();
        }
    }
    
    private async setupEnvironment() {
        const tempDir = tl.resolve(tl.getVariable('Agent.TempDirectory'), `task-${Date.now()}`);
        tl.mkdirP(tempDir);
        this.tempDirs.push(tempDir);
    }
    
    private async cleanup() {
        // Clean up temporary files
        for (const file of this.tempFiles) {
            try {
                if (tl.exist(file)) {
                    tl.debug(`Removing temporary file: ${file}`);
                    // Use appropriate removal method
                }
            } catch (error) {
                tl.warning(`Failed to remove temporary file: ${file}`);
            }
        }
        
        // Clean up temporary directories
        for (const dir of this.tempDirs) {
            try {
                if (tl.exist(dir)) {
                    tl.debug(`Removing temporary directory: ${dir}`);
                    // Use appropriate removal method
                }
            } catch (error) {
                tl.warning(`Failed to remove temporary directory: ${dir}`);
            }
        }
    }
}
```

## Common Patterns

### Task Template

```typescript
import tl = require('azure-pipelines-task-lib/task');

interface TaskInputs {
    sourceDirectory: string;
    configuration: string;
    enableLogging: boolean;
    timeout: number;
}

async function run(): Promise<void> {
    try {
        // Get and validate inputs
        const inputs = getTaskInputs();
        if (!validateInputs(inputs)) {
            return; // Error already set
        }
        
        // Log environment info (debug mode)
        logEnvironmentInfo();
        
        // Execute main logic
        await executeTask(inputs);
        
        // Success
        tl.setResult(tl.TaskResult.Succeeded, 'Task completed successfully');
        
    } catch (error) {
        // Handle unexpected errors
        if (error instanceof Error) {
            tl.error(`Unexpected error: ${error.message}`);
            tl.setResult(tl.TaskResult.Failed, error.message);
        } else {
            tl.error(`Unknown error: ${error}`);
            tl.setResult(tl.TaskResult.Failed, 'Unknown error occurred');
        }
    }
}

function getTaskInputs(): TaskInputs {
    return {
        sourceDirectory: tl.getInputRequired('sourceDirectory'),
        configuration: tl.getInput('configuration') || 'Release',
        enableLogging: tl.getBoolInput('enableLogging'),
        timeout: parseInt(tl.getInput('timeout') || '60')
    };
}

function validateInputs(inputs: TaskInputs): boolean {
    if (!tl.exist(inputs.sourceDirectory)) {
        tl.setResult(tl.TaskResult.Failed, `Source directory not found: ${inputs.sourceDirectory}`);
        return false;
    }
    
    if (inputs.timeout <= 0) {
        tl.setResult(tl.TaskResult.Failed, 'Timeout must be greater than 0');
        return false;
    }
    
    return true;
}

async function executeTask(inputs: TaskInputs): Promise<void> {
    // Your task implementation here
    tl.debug(`Processing directory: ${inputs.sourceDirectory}`);
    tl.debug(`Configuration: ${inputs.configuration}`);
    tl.debug(`Logging enabled: ${inputs.enableLogging}`);
    tl.debug(`Timeout: ${inputs.timeout} seconds`);
}

function logEnvironmentInfo(): void {
    tl.debug(`Build ID: ${tl.getVariable('Build.BuildId')}`);
    tl.debug(`Agent OS: ${tl.getVariable('Agent.OS')}`);
    tl.debug(`Working Directory: ${tl.getVariable('System.DefaultWorkingDirectory')}`);
}

// Entry point
run().catch((error) => {
    tl.error(`Task execution failed: ${error}`);
    tl.setResult(tl.TaskResult.Failed, 'Task execution failed');
});
```

### File Processing Pattern

```typescript
import * as path from 'path';
import * as fs from 'fs';

async function processFilesInDirectory(directory: string, pattern: string): Promise<string[]> {
    const processedFiles: string[] = [];
    
    try {
        // Get all files matching pattern
        const files = await getMatchingFiles(directory, pattern);
        tl.debug(`Found ${files.length} files matching pattern: ${pattern}`);
        
        // Process each file
        for (const file of files) {
            try {
                await processFile(file);
                processedFiles.push(file);
                tl.debug(`✓ Successfully processed: ${path.basename(file)}`);
            } catch (error) {
                tl.warning(`⚠ Failed to process ${path.basename(file)}: ${error.message}`);
            }
        }
        
        return processedFiles;
        
    } catch (error) {
        throw new Error(`Failed to process files in directory ${directory}: ${error.message}`);
    }
}

async function getMatchingFiles(directory: string, pattern: string): Promise<string[]> {
    const files: string[] = [];
    
    if (!tl.exist(directory)) {
        throw new Error(`Directory does not exist: ${directory}`);
    }
    
    const entries = await fs.promises.readdir(directory, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        
        if (entry.isFile() && entry.name.match(pattern)) {
            files.push(fullPath);
        }
    }
    
    return files;
}

async function processFile(filePath: string): Promise<void> {
    // Your file processing logic here
    const content = await fs.promises.readFile(filePath, 'utf-8');
    // Process content...
    // Write output if needed...
}
```

## 📚 Additional Resources

### Official Documentation
- [Azure DevOps Task Library GitHub](https://github.com/Microsoft/azure-pipelines-task-lib)
- [Azure DevOps Task SDK Documentation](https://docs.microsoft.com/en-us/azure/devops/extend/develop/add-build-task)
- [Azure DevOps Predefined Variables](https://docs.microsoft.com/en-us/azure/devops/pipelines/build/variables)

### Related Libraries
- `azure-devops-extension-sdk` - For web extensions
- `azure-devops-ui` - UI components for extensions
- `azure-devops-node-api` - REST API client

### Best Practices
- Always validate inputs thoroughly
- Use proper error handling and cleanup
- Provide detailed logging for troubleshooting
- Test on multiple platforms (Windows, macOS, Linux)
- Follow semantic versioning for task versions
- Document all task inputs and outputs clearly

---

*This documentation covers Azure Pipelines Task Library version 5.2.1. For the latest features and updates, refer to the official documentation and release notes.*