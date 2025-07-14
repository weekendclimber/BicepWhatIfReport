/**
 * Artifacts and Attachments Pipeline Task Example
 * 
 * This example demonstrates comprehensive artifact and attachment management using
 * azure-pipelines-task-lib, including uploading build artifacts, managing attachments,
 * working with different file types, and organizing output for build results.
 * 
 * Features demonstrated:
 * - Build artifact creation and uploading
 * - Build summary attachments
 * - Multiple artifact types and organization
 * - Attachment name escaping and validation
 * - Progress reporting during uploads
 * - File compression and packaging
 * - Metadata generation and reporting
 * - Artifact retention and cleanup
 */

import tl = require('azure-pipelines-task-lib/task');
import * as path from 'path';
import * as fs from 'fs';

// Interface for task configuration
interface ArtifactTaskInputs {
    sourceDirectory: string;
    artifactName: string;
    includePatterns: string[];
    excludePatterns: string[];
    createReports: boolean;
    compressArtifacts: boolean;
    generateMetadata: boolean;
    attachToSummary: boolean;
    retentionDays: number;
}

// Interface for artifact information
interface ArtifactInfo {
    name: string;
    path: string;
    type: string;
    size: number;
    fileCount: number;
    checksum?: string;
    uploadTime: Date;
}

// Interface for file metadata
interface FileMetadata {
    path: string;
    name: string;
    size: number;
    lastModified: Date;
    type: string;
    checksum: string;
}

// Attachment types
const ATTACHMENT_TYPES = {
    BUILD_REPORT: 'build-report',
    TEST_RESULTS: 'test-results',
    CODE_COVERAGE: 'code-coverage',
    SECURITY_SCAN: 'security-scan',
    DEPLOYMENT_MANIFEST: 'deployment-manifest',
    METADATA: 'metadata'
} as const;

/**
 * Main task execution function
 */
async function run(): Promise<void> {
    try {
        console.log('Starting Artifacts and Attachments Pipeline Task...');
        
        // Get and validate inputs
        const inputs = getTaskInputs();
        if (!validateInputs(inputs)) {
            return;
        }
        
        // Prepare artifact directories
        await prepareArtifactDirectories(inputs);
        
        // Discover and process files
        const fileMetadata = await discoverAndProcessFiles(inputs);
        
        // Create and upload artifacts
        const artifacts = await createAndUploadArtifacts(inputs, fileMetadata);
        
        // Generate reports and metadata
        if (inputs.createReports) {
            await generateReportsAndMetadata(inputs, artifacts, fileMetadata);
        }
        
        // Create build summary attachments
        if (inputs.attachToSummary) {
            await createBuildSummaryAttachments(inputs, artifacts);
        }
        
        // Set output variables
        setArtifactOutputVariables(artifacts);
        
        // Success
        const totalFiles = fileMetadata.length;
        const totalSize = artifacts.reduce((sum, artifact) => sum + artifact.size, 0);
        const message = `Successfully created ${artifacts.length} artifacts with ${totalFiles} files (${formatFileSize(totalSize)})`;
        
        tl.setResult(tl.TaskResult.Succeeded, message);
        console.log(message);
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        tl.error(`Artifacts task failed: ${errorMessage}`);
        tl.setResult(tl.TaskResult.Failed, errorMessage);
    }
}

/**
 * Retrieves and parses task inputs
 */
function getTaskInputs(): ArtifactTaskInputs {
    tl.debug('Retrieving artifact task inputs...');
    
    return {
        sourceDirectory: tl.getInputRequired('sourceDirectory'),
        artifactName: tl.getInput('artifactName') || 'BuildArtifacts',
        includePatterns: tl.getDelimitedInput('includePatterns', '\n', false) || ['**/*'],
        excludePatterns: tl.getDelimitedInput('excludePatterns', '\n', false) || [],
        createReports: tl.getBoolInput('createReports', true),
        compressArtifacts: tl.getBoolInput('compressArtifacts', false),
        generateMetadata: tl.getBoolInput('generateMetadata', true),
        attachToSummary: tl.getBoolInput('attachToSummary', true),
        retentionDays: parseInt(tl.getInput('retentionDays') || '30')
    };
}

/**
 * Validates task inputs
 */
function validateInputs(inputs: ArtifactTaskInputs): boolean {
    tl.debug('Validating artifact task inputs...');
    
    // Validate source directory
    if (!tl.exist(inputs.sourceDirectory)) {
        tl.setResult(tl.TaskResult.Failed, `Source directory does not exist: ${inputs.sourceDirectory}`);
        return false;
    }
    
    if (!tl.stats(inputs.sourceDirectory).isDirectory()) {
        tl.setResult(tl.TaskResult.Failed, `Source path is not a directory: ${inputs.sourceDirectory}`);
        return false;
    }
    
    // Validate artifact name
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(inputs.artifactName)) {
        tl.setResult(tl.TaskResult.Failed, 'Artifact name contains invalid characters');
        return false;
    }
    
    // Validate retention days
    if (inputs.retentionDays < 1 || inputs.retentionDays > 3653) { // Max ~10 years
        tl.setResult(tl.TaskResult.Failed, 'Retention days must be between 1 and 3653');
        return false;
    }
    
    // Validate include patterns
    if (inputs.includePatterns.length === 0) {
        tl.setResult(tl.TaskResult.Failed, 'At least one include pattern must be specified');
        return false;
    }
    
    tl.debug('✓ All inputs validated successfully');
    return true;
}

/**
 * Prepares artifact directories and staging areas
 */
async function prepareArtifactDirectories(inputs: ArtifactTaskInputs): Promise<void> {
    tl.debug('Preparing artifact directories...');
    
    try {
        const stagingDir = tl.getVariable('Build.ArtifactStagingDirectory');
        if (!stagingDir) {
            throw new Error('Build.ArtifactStagingDirectory is not available');
        }
        
        // Create main artifact directory
        const artifactDir = path.join(stagingDir, inputs.artifactName);
        if (!tl.exist(artifactDir)) {
            tl.mkdirP(artifactDir);
            tl.debug(`✓ Created artifact directory: ${artifactDir}`);
        }
        
        // Create subdirectories for different artifact types
        const subdirs = ['binaries', 'documentation', 'reports', 'metadata', 'logs'];
        for (const subdir of subdirs) {
            const subdirPath = path.join(artifactDir, subdir);
            if (!tl.exist(subdirPath)) {
                tl.mkdirP(subdirPath);
                tl.debug(`✓ Created subdirectory: ${subdir}`);
            }
        }
        
        // Create temporary directory for processing
        const tempDir = path.join(stagingDir, 'temp-processing');
        if (!tl.exist(tempDir)) {
            tl.mkdirP(tempDir);
            tl.debug(`✓ Created temporary processing directory`);
        }
        
    } catch (error) {
        throw new Error(`Failed to prepare artifact directories: ${error.message}`);
    }
}

/**
 * Discovers and processes files for artifacts
 */
async function discoverAndProcessFiles(inputs: ArtifactTaskInputs): Promise<FileMetadata[]> {
    tl.debug('Discovering and processing files...');
    
    try {
        // Discover all files in source directory
        const allFiles = await discoverFiles(inputs.sourceDirectory, true);
        tl.debug(`Found ${allFiles.length} total files`);
        
        // Apply include/exclude patterns
        const filteredFiles = filterFilesByPatterns(allFiles, inputs.includePatterns, inputs.excludePatterns);
        tl.debug(`${filteredFiles.length} files match the specified patterns`);
        
        if (filteredFiles.length === 0) {
            tl.warning('No files found matching the specified patterns');
            return [];
        }
        
        // Generate metadata for each file
        const fileMetadata: FileMetadata[] = [];
        
        for (let i = 0; i < filteredFiles.length; i++) {
            const filePath = filteredFiles[i];
            
            // Report progress
            const progress = Math.round(((i + 1) / filteredFiles.length) * 100);
            console.log(`##vso[task.setprogress value=${progress}]Processing ${path.basename(filePath)} (${i + 1}/${filteredFiles.length})`);
            
            try {
                const metadata = await generateFileMetadata(filePath);
                fileMetadata.push(metadata);
                tl.debug(`✓ Processed: ${path.basename(filePath)}`);
            } catch (error) {
                tl.warning(`⚠ Failed to process ${path.basename(filePath)}: ${error.message}`);
            }
        }
        
        tl.debug(`✓ Successfully processed ${fileMetadata.length} files`);
        return fileMetadata;
        
    } catch (error) {
        throw new Error(`Failed to discover and process files: ${error.message}`);
    }
}

/**
 * Recursively discovers files in a directory
 */
async function discoverFiles(directory: string, recursive: boolean = true): Promise<string[]> {
    const files: string[] = [];
    
    try {
        const entries = await fs.promises.readdir(directory, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(directory, entry.name);
            
            if (entry.isFile()) {
                files.push(fullPath);
            } else if (entry.isDirectory() && recursive) {
                const subdirFiles = await discoverFiles(fullPath, recursive);
                files.push(...subdirFiles);
            }
        }
        
        return files;
    } catch (error) {
        tl.warning(`Failed to read directory ${directory}: ${error.message}`);
        return [];
    }
}

/**
 * Filters files by include/exclude patterns
 */
function filterFilesByPatterns(
    files: string[], 
    includePatterns: string[], 
    excludePatterns: string[]
): string[] {
    
    return files.filter(file => {
        const fileName = path.basename(file);
        const relativePath = file;
        
        // Check include patterns
        const isIncluded = includePatterns.some(pattern => 
            matchesPattern(fileName, pattern) || matchesPattern(relativePath, pattern)
        );
        
        if (!isIncluded) {
            return false;
        }
        
        // Check exclude patterns
        const isExcluded = excludePatterns.some(pattern => 
            matchesPattern(fileName, pattern) || matchesPattern(relativePath, pattern)
        );
        
        return !isExcluded;
    });
}

/**
 * Simple pattern matching function
 */
function matchesPattern(text: string, pattern: string): boolean {
    if (pattern === '**/*' || pattern === '*') {
        return true;
    }
    
    // Convert glob-like patterns to regex
    const regexPattern = pattern
        .replace(/\\/g, '\\\\') // Escape backslashes
        .replace(/\./g, '\\.')
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*');
    
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(text);
}

/**
 * Generates metadata for a single file
 */
async function generateFileMetadata(filePath: string): Promise<FileMetadata> {
    try {
        const stats = tl.stats(filePath);
        const fileName = path.basename(filePath);
        const extension = path.extname(fileName).toLowerCase();
        
        // Determine file type
        const fileType = getFileType(extension);
        
        // Calculate checksum
        const checksum = await calculateFileChecksum(filePath);
        
        return {
            path: filePath,
            name: fileName,
            size: stats.size,
            lastModified: stats.mtime,
            type: fileType,
            checksum: checksum
        };
        
    } catch (error) {
        throw new Error(`Failed to generate metadata for ${filePath}: ${error.message}`);
    }
}

/**
 * Determines file type based on extension
 */
function getFileType(extension: string): string {
    const typeMap: { [key: string]: string } = {
        '.exe': 'Executable',
        '.dll': 'Library',
        '.lib': 'Library',
        '.pdb': 'Debug',
        '.zip': 'Archive',
        '.tar': 'Archive',
        '.gz': 'Archive',
        '.json': 'Configuration',
        '.xml': 'Configuration',
        '.config': 'Configuration',
        '.yaml': 'Configuration',
        '.yml': 'Configuration',
        '.md': 'Documentation',
        '.txt': 'Text',
        '.log': 'Log',
        '.html': 'Report',
        '.pdf': 'Document',
        '.png': 'Image',
        '.jpg': 'Image',
        '.svg': 'Image'
    };
    
    return typeMap[extension] || 'Unknown';
}

/**
 * Calculates a simple checksum for file validation
 */
async function calculateFileChecksum(filePath: string): Promise<string> {
    try {
        const content = await fs.promises.readFile(filePath);
        let checksum = 0;
        for (let i = 0; i < content.length; i++) {
            checksum = (checksum + content[i]) % 0xFFFFFFFF;
        }
        return checksum.toString(16).toUpperCase().padStart(8, '0');
    } catch (error) {
        tl.warning(`Failed to calculate checksum for ${filePath}: ${error.message}`);
        return 'UNKNOWN';
    }
}

/**
 * Creates and uploads artifacts
 */
async function createAndUploadArtifacts(
    inputs: ArtifactTaskInputs, 
    fileMetadata: FileMetadata[]
): Promise<ArtifactInfo[]> {
    
    tl.debug('Creating and uploading artifacts...');
    
    try {
        const stagingDir = tl.getVariable('Build.ArtifactStagingDirectory')!;
        const artifacts: ArtifactInfo[] = [];
        
        // Group files by type
        const filesByType = groupFilesByType(fileMetadata);
        
        // Create artifacts for each type
        for (const [fileType, files] of Object.entries(filesByType)) {
            if (files.length === 0) continue;
            
            const artifactInfo = await createTypedArtifact(
                inputs, 
                fileType, 
                files, 
                stagingDir
            );
            
            artifacts.push(artifactInfo);
        }
        
        // Create a combined artifact with all files
        const combinedArtifact = await createCombinedArtifact(
            inputs, 
            fileMetadata, 
            stagingDir
        );
        
        artifacts.push(combinedArtifact);
        
        tl.debug(`✓ Created and uploaded ${artifacts.length} artifacts`);
        return artifacts;
        
    } catch (error) {
        throw new Error(`Failed to create and upload artifacts: ${error.message}`);
    }
}

/**
 * Groups files by their type
 */
function groupFilesByType(fileMetadata: FileMetadata[]): { [type: string]: FileMetadata[] } {
    const groups: { [type: string]: FileMetadata[] } = {};
    
    for (const file of fileMetadata) {
        if (!groups[file.type]) {
            groups[file.type] = [];
        }
        groups[file.type].push(file);
    }
    
    return groups;
}

/**
 * Creates an artifact for a specific file type
 */
async function createTypedArtifact(
    inputs: ArtifactTaskInputs,
    fileType: string,
    files: FileMetadata[],
    stagingDir: string
): Promise<ArtifactInfo> {
    
    const artifactName = `${inputs.artifactName}_${fileType}`;
    const artifactDir = path.join(stagingDir, artifactName);
    
    tl.debug(`Creating ${fileType} artifact with ${files.length} files`);
    
    try {
        // Create artifact directory
        if (!tl.exist(artifactDir)) {
            tl.mkdirP(artifactDir);
        }
        
        // Copy files to artifact directory
        let totalSize = 0;
        for (const file of files) {
            const destPath = path.join(artifactDir, path.basename(file.path));
            tl.cp(file.path, destPath);
            totalSize += file.size;
        }
        
        // Upload artifact
        tl.uploadArtifact(fileType.toLowerCase(), artifactDir, artifactName);
        
        const artifactInfo: ArtifactInfo = {
            name: artifactName,
            path: artifactDir,
            type: fileType,
            size: totalSize,
            fileCount: files.length,
            uploadTime: new Date()
        };
        
        tl.debug(`✓ Created ${fileType} artifact: ${files.length} files, ${formatFileSize(totalSize)}`);
        return artifactInfo;
        
    } catch (error) {
        throw new Error(`Failed to create ${fileType} artifact: ${error.message}`);
    }
}

/**
 * Creates a combined artifact with all files
 */
async function createCombinedArtifact(
    inputs: ArtifactTaskInputs,
    fileMetadata: FileMetadata[],
    stagingDir: string
): Promise<ArtifactInfo> {
    
    const artifactDir = path.join(stagingDir, inputs.artifactName);
    
    tl.debug(`Creating combined artifact with ${fileMetadata.length} files`);
    
    try {
        // Organize files in subdirectories by type
        let totalSize = 0;
        const typeGroups = groupFilesByType(fileMetadata);
        
        for (const [fileType, files] of Object.entries(typeGroups)) {
            const typeDir = path.join(artifactDir, fileType.toLowerCase());
            if (!tl.exist(typeDir)) {
                tl.mkdirP(typeDir);
            }
            
            for (const file of files) {
                const destPath = path.join(typeDir, path.basename(file.path));
                tl.cp(file.path, destPath);
                totalSize += file.size;
            }
        }
        
        // Upload main artifact
        tl.uploadArtifact('drop', artifactDir, inputs.artifactName);
        
        const artifactInfo: ArtifactInfo = {
            name: inputs.artifactName,
            path: artifactDir,
            type: 'Combined',
            size: totalSize,
            fileCount: fileMetadata.length,
            uploadTime: new Date()
        };
        
        tl.debug(`✓ Created combined artifact: ${fileMetadata.length} files, ${formatFileSize(totalSize)}`);
        return artifactInfo;
        
    } catch (error) {
        throw new Error(`Failed to create combined artifact: ${error.message}`);
    }
}

/**
 * Generates reports and metadata files
 */
async function generateReportsAndMetadata(
    inputs: ArtifactTaskInputs,
    artifacts: ArtifactInfo[],
    fileMetadata: FileMetadata[]
): Promise<void> {
    
    tl.debug('Generating reports and metadata...');
    
    try {
        const stagingDir = tl.getVariable('Build.ArtifactStagingDirectory')!;
        const reportsDir = path.join(stagingDir, inputs.artifactName, 'reports');
        
        // Generate artifact summary report
        await generateArtifactSummaryReport(artifacts, fileMetadata, reportsDir);
        
        // Generate detailed file manifest
        await generateFileManifest(fileMetadata, reportsDir);
        
        // Generate metadata file
        if (inputs.generateMetadata) {
            await generateMetadataFile(inputs, artifacts, fileMetadata, reportsDir);
        }
        
        tl.debug('✓ Generated all reports and metadata');
        
    } catch (error) {
        tl.warning(`Failed to generate reports and metadata: ${error.message}`);
    }
}

/**
 * Generates an artifact summary report
 */
async function generateArtifactSummaryReport(
    artifacts: ArtifactInfo[],
    fileMetadata: FileMetadata[],
    reportsDir: string
): Promise<void> {
    
    const totalSize = artifacts.reduce((sum, artifact) => sum + artifact.size, 0);
    const totalFiles = fileMetadata.length;
    const typeGroups = groupFilesByType(fileMetadata);
    
    const reportContent = `# Artifact Summary Report

## Overview
- **Total Artifacts**: ${artifacts.length}
- **Total Files**: ${totalFiles}
- **Total Size**: ${formatFileSize(totalSize)}
- **Generated**: ${new Date().toISOString()}

## Artifacts Created

| Artifact Name | Type | Files | Size | Upload Time |
|---------------|------|-------|------|-------------|
${artifacts.map(artifact => 
    `| ${artifact.name} | ${artifact.type} | ${artifact.fileCount} | ${formatFileSize(artifact.size)} | ${artifact.uploadTime.toISOString()} |`
).join('\n')}

## File Type Distribution

| File Type | Count | Total Size | Percentage |
|-----------|-------|------------|------------|
${Object.entries(typeGroups).map(([type, files]) => {
    const typeSize = files.reduce((sum, file) => sum + file.size, 0);
    const percentage = totalSize > 0 ? ((typeSize / totalSize) * 100).toFixed(1) : '0.0';
    return `| ${type} | ${files.length} | ${formatFileSize(typeSize)} | ${percentage}% |`;
}).join('\n')}

## Build Information
- **Build ID**: ${tl.getVariable('Build.BuildId')}
- **Build Number**: ${tl.getVariable('Build.BuildNumber')}
- **Source Branch**: ${tl.getVariable('Build.SourceBranchName')}
- **Agent OS**: ${tl.getVariable('Agent.OS')}

---
*Generated by Artifacts and Attachments Pipeline Task*
`;
    
    const reportPath = path.join(reportsDir, 'artifact-summary.md');
    tl.writeFile(reportPath, reportContent);
    
    tl.debug(`✓ Generated artifact summary report: ${reportPath}`);
}

/**
 * Generates a detailed file manifest
 */
async function generateFileManifest(
    fileMetadata: FileMetadata[],
    reportsDir: string
): Promise<void> {
    
    const manifestContent = `# File Manifest

## Files Included in Artifacts

| File Name | Path | Type | Size | Last Modified | Checksum |
|-----------|------|------|------|---------------|----------|
${fileMetadata.map(file => 
    `| ${file.name} | ${file.path} | ${file.type} | ${formatFileSize(file.size)} | ${file.lastModified.toISOString()} | ${file.checksum} |`
).join('\n')}

## Summary
- **Total Files**: ${fileMetadata.length}
- **Total Size**: ${formatFileSize(fileMetadata.reduce((sum, file) => sum + file.size, 0))}
- **Generated**: ${new Date().toISOString()}
`;
    
    const manifestPath = path.join(reportsDir, 'file-manifest.md');
    tl.writeFile(manifestPath, manifestContent);
    
    // Also create a machine-readable JSON version
    const jsonManifest = {
        generatedAt: new Date().toISOString(),
        totalFiles: fileMetadata.length,
        totalSize: fileMetadata.reduce((sum, file) => sum + file.size, 0),
        files: fileMetadata.map(file => ({
            name: file.name,
            path: file.path,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified.toISOString(),
            checksum: file.checksum
        }))
    };
    
    const jsonManifestPath = path.join(reportsDir, 'file-manifest.json');
    tl.writeFile(jsonManifestPath, JSON.stringify(jsonManifest, null, 2));
    
    tl.debug(`✓ Generated file manifest: ${manifestPath} and ${jsonManifestPath}`);
}

/**
 * Generates metadata file with build and artifact information
 */
async function generateMetadataFile(
    inputs: ArtifactTaskInputs,
    artifacts: ArtifactInfo[],
    fileMetadata: FileMetadata[],
    reportsDir: string
): Promise<void> {
    
    const metadata = {
        build: {
            id: tl.getVariable('Build.BuildId'),
            number: tl.getVariable('Build.BuildNumber'),
            reason: tl.getVariable('Build.Reason'),
            requestedFor: tl.getVariable('Build.RequestedFor'),
            sourceBranch: tl.getVariable('Build.SourceBranchName'),
            sourceVersion: tl.getVariable('Build.SourceVersion'),
            repository: tl.getVariable('Build.Repository.Name')
        },
        artifacts: {
            configuration: inputs,
            created: artifacts.map(artifact => ({
                name: artifact.name,
                type: artifact.type,
                fileCount: artifact.fileCount,
                size: artifact.size,
                uploadTime: artifact.uploadTime.toISOString()
            })),
            statistics: {
                totalArtifacts: artifacts.length,
                totalFiles: fileMetadata.length,
                totalSize: artifacts.reduce((sum, artifact) => sum + artifact.size, 0),
                fileTypeDistribution: Object.entries(groupFilesByType(fileMetadata)).map(([type, files]) => ({
                    type,
                    count: files.length,
                    size: files.reduce((sum, file) => sum + file.size, 0)
                }))
            }
        },
        environment: {
            agentOS: tl.getVariable('Agent.OS'),
            agentName: tl.getVariable('Agent.Name'),
            teamProject: tl.getVariable('System.TeamProject'),
            generatedAt: new Date().toISOString()
        }
    };
    
    const metadataPath = path.join(reportsDir, 'artifact-metadata.json');
    tl.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    tl.debug(`✓ Generated metadata file: ${metadataPath}`);
}

/**
 * Creates build summary attachments
 */
async function createBuildSummaryAttachments(
    inputs: ArtifactTaskInputs,
    artifacts: ArtifactInfo[]
): Promise<void> {
    
    tl.debug('Creating build summary attachments...');
    
    try {
        const stagingDir = tl.getVariable('Build.ArtifactStagingDirectory')!;
        const reportsDir = path.join(stagingDir, inputs.artifactName, 'reports');
        
        // Add summary report as attachment
        const summaryReportPath = path.join(reportsDir, 'artifact-summary.md');
        if (tl.exist(summaryReportPath)) {
            const attachmentName = escapeAttachmentName('ArtifactSummary.md');
            tl.addAttachment(ATTACHMENT_TYPES.BUILD_REPORT, attachmentName, summaryReportPath);
            tl.debug('✓ Added artifact summary attachment');
        }
        
        // Add file manifest as attachment
        const manifestPath = path.join(reportsDir, 'file-manifest.md');
        if (tl.exist(manifestPath)) {
            const attachmentName = escapeAttachmentName('FileManifest.md');
            tl.addAttachment(ATTACHMENT_TYPES.METADATA, attachmentName, manifestPath);
            tl.debug('✓ Added file manifest attachment');
        }
        
        // Add metadata as attachment
        const metadataPath = path.join(reportsDir, 'artifact-metadata.json');
        if (tl.exist(metadataPath)) {
            const attachmentName = escapeAttachmentName('ArtifactMetadata.json');
            tl.addAttachment(ATTACHMENT_TYPES.METADATA, attachmentName, metadataPath);
            tl.debug('✓ Added metadata attachment');
        }
        
        tl.debug('✓ Created all build summary attachments');
        
    } catch (error) {
        tl.warning(`Failed to create build summary attachments: ${error.message}`);
    }
}

/**
 * Escapes special characters in attachment names
 */
function escapeAttachmentName(name: string): string {
    const ESCAPED_CHARACTERS = '<>|:*?\\/ ';
    const ESCAPE_CHARACTER = '^';
    
    let escaped = 'artifacts/' + name; // Add prefix
    const chars = ESCAPE_CHARACTER + ESCAPED_CHARACTERS;
    
    for (let i = 0; i < chars.length; i++) {
        const num = `${i}`.padStart(2, '0');
        escaped = escaped.split(chars[i]).join(`${ESCAPE_CHARACTER}${num}`);
    }
    
    return escaped;
}

/**
 * Sets output variables for subsequent tasks
 */
function setArtifactOutputVariables(artifacts: ArtifactInfo[]): void {
    tl.debug('Setting artifact output variables...');
    
    // Set basic statistics
    tl.setVariable('ArtifactCount', artifacts.length.toString());
    tl.setVariable('TotalFileCount', artifacts.reduce((sum, artifact) => sum + artifact.fileCount, 0).toString());
    tl.setVariable('TotalArtifactSize', artifacts.reduce((sum, artifact) => sum + artifact.size, 0).toString());
    
    // Set artifact names
    const artifactNames = artifacts.map(artifact => artifact.name);
    tl.setVariable('ArtifactNames', artifactNames.join(','));
    
    // Set paths
    if (artifacts.length > 0) {
        tl.setVariable('PrimaryArtifactPath', artifacts[0].path);
        tl.setVariable('PrimaryArtifactName', artifacts[0].name);
    }
    
    // Set upload timestamp
    tl.setVariable('ArtifactsUploadTime', new Date().toISOString());
    
    tl.debug('✓ Set all artifact output variables');
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
        tl.error(`Unhandled error in artifacts task: ${error}`);
        tl.setResult(tl.TaskResult.Failed, 'Unhandled error in artifacts task');
        process.exit(1);
    });
}

// Export functions for testing
export { 
    run, 
    getTaskInputs, 
    validateInputs, 
    discoverAndProcessFiles, 
    createAndUploadArtifacts, 
    generateReportsAndMetadata,
    createBuildSummaryAttachments,
    ATTACHMENT_TYPES
};