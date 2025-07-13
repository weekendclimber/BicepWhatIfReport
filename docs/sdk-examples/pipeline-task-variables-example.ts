/**
 * Variables and Input Management Pipeline Task Example
 * 
 * This example demonstrates comprehensive variable and input management using
 * azure-pipelines-task-lib, including working with different input types,
 * environment variables, and pipeline variables.
 * 
 * Features demonstrated:
 * - Different input types (string, boolean, number, delimited, secret)
 * - System and build variables access
 * - Setting output variables for subsequent tasks
 * - Variable validation and transformation
 * - Secure variable handling
 * - Environment variable management
 * - Configuration file processing
 * - Dynamic variable computation
 */

import tl = require('azure-pipelines-task-lib/task');
import * as path from 'path';

// Interface for all task inputs
interface VariableTaskInputs {
    // Basic inputs
    configurationName: string;
    environmentName: string;
    deploymentSlot: string;
    
    // Boolean inputs
    enableFeatureFlags: boolean;
    skipValidation: boolean;
    verboseLogging: boolean;
    createBackup: boolean;
    
    // Numeric inputs
    timeoutMinutes: number;
    retryAttempts: number;
    parallelJobs: number;
    
    // Delimited inputs
    targetRegions: string[];
    featureFlags: string[];
    excludeFiles: string[];
    
    // Secret inputs
    apiKey: string;
    connectionString: string;
    
    // Optional inputs with defaults
    buildConfiguration: string;
    logLevel: string;
    outputFormat: string;
}

// Interface for computed variables
interface ComputedVariables {
    deploymentId: string;
    buildTimestamp: string;
    versionNumber: string;
    environmentPrefix: string;
    outputDirectory: string;
    configurationFile: string;
    isProductionDeployment: boolean;
    shouldRunTests: boolean;
}

/**
 * Main task execution function
 */
async function run(): Promise<void> {
    try {
        console.log('Starting Variables and Input Management Task...');
        
        // Step 1: Get and validate all inputs
        const inputs = getTaskInputs();
        if (!validateInputs(inputs)) {
            return;
        }
        
        // Step 2: Log environment and system information
        logSystemInformation();
        
        // Step 3: Process and compute derived variables
        const computedVars = computeVariables(inputs);
        
        // Step 4: Set output variables for subsequent tasks
        setOutputVariables(inputs, computedVars);
        
        // Step 5: Process configuration files
        await processConfigurationFiles(inputs, computedVars);
        
        // Step 6: Demonstrate variable operations
        await demonstrateVariableOperations(inputs, computedVars);
        
        // Success
        const message = `Variable management task completed successfully for environment: ${inputs.environmentName}`;
        tl.setResult(tl.TaskResult.Succeeded, message);
        console.log(message);
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        tl.error(`Variable management task failed: ${errorMessage}`);
        tl.setResult(tl.TaskResult.Failed, errorMessage);
    }
}

/**
 * Retrieves and parses all task inputs
 */
function getTaskInputs(): VariableTaskInputs {
    tl.debug('Retrieving task inputs...');
    
    return {
        // Required string inputs
        configurationName: tl.getInputRequired('configurationName'),
        environmentName: tl.getInputRequired('environmentName'),
        deploymentSlot: tl.getInputRequired('deploymentSlot'),
        
        // Boolean inputs
        enableFeatureFlags: tl.getBoolInput('enableFeatureFlags', false),
        skipValidation: tl.getBoolInput('skipValidation', false),
        verboseLogging: tl.getBoolInput('verboseLogging', false),
        createBackup: tl.getBoolInput('createBackup', true),
        
        // Numeric inputs with validation
        timeoutMinutes: parseInt(tl.getInput('timeoutMinutes') || '30'),
        retryAttempts: parseInt(tl.getInput('retryAttempts') || '3'),
        parallelJobs: parseInt(tl.getInput('parallelJobs') || '1'),
        
        // Delimited inputs (arrays)
        targetRegions: tl.getDelimitedInput('targetRegions', ',', false) || [],
        featureFlags: tl.getDelimitedInput('featureFlags', '\n', false) || [],
        excludeFiles: tl.getDelimitedInput('excludeFiles', ';', false) || [],
        
        // Secret inputs (these will be masked in logs)
        apiKey: tl.getInputRequired('apiKey'),
        connectionString: tl.getInputRequired('connectionString'),
        
        // Optional inputs with defaults
        buildConfiguration: tl.getInput('buildConfiguration') || 'Release',
        logLevel: tl.getInput('logLevel') || 'Information',
        outputFormat: tl.getInput('outputFormat') || 'json'
    };
}

/**
 * Validates all task inputs
 */
function validateInputs(inputs: VariableTaskInputs): boolean {
    tl.debug('Validating task inputs...');
    
    // Validate environment name
    const validEnvironments = ['Development', 'Testing', 'Staging', 'Production'];
    if (!validEnvironments.includes(inputs.environmentName)) {
        tl.setResult(
            tl.TaskResult.Failed,
            `Invalid environment name: ${inputs.environmentName}. Valid values: ${validEnvironments.join(', ')}`
        );
        return false;
    }
    
    // Validate deployment slot
    const validSlots = ['blue', 'green', 'primary', 'secondary'];
    if (!validSlots.includes(inputs.deploymentSlot.toLowerCase())) {
        tl.setResult(
            tl.TaskResult.Failed,
            `Invalid deployment slot: ${inputs.deploymentSlot}. Valid values: ${validSlots.join(', ')}`
        );
        return false;
    }
    
    // Validate numeric inputs
    if (inputs.timeoutMinutes <= 0 || inputs.timeoutMinutes > 1440) { // Max 24 hours
        tl.setResult(tl.TaskResult.Failed, 'Timeout must be between 1 and 1440 minutes');
        return false;
    }
    
    if (inputs.retryAttempts < 0 || inputs.retryAttempts > 10) {
        tl.setResult(tl.TaskResult.Failed, 'Retry attempts must be between 0 and 10');
        return false;
    }
    
    if (inputs.parallelJobs < 1 || inputs.parallelJobs > 50) {
        tl.setResult(tl.TaskResult.Failed, 'Parallel jobs must be between 1 and 50');
        return false;
    }
    
    // Validate log level
    const validLogLevels = ['Trace', 'Debug', 'Information', 'Warning', 'Error', 'Critical'];
    const normalizedLogLevels = validLogLevels.map(level => level.toLowerCase());
    if (!normalizedLogLevels.includes(inputs.logLevel.toLowerCase())) {
        tl.setResult(
            tl.TaskResult.Failed,
            `Invalid log level: ${inputs.logLevel}. Valid values: ${validLogLevels.join(', ')}`
        );
        return false;
    }
    
    // Validate output format
    const validFormats = ['json', 'xml', 'yaml', 'text'];
    if (!validFormats.includes(inputs.outputFormat.toLowerCase())) {
        tl.setResult(
            tl.TaskResult.Failed,
            `Invalid output format: ${inputs.outputFormat}. Valid values: ${validFormats.join(', ')}`
        );
        return false;
    }
    
    // Validate target regions if specified
    if (inputs.targetRegions.length > 0) {
        const validRegions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1'];
        const invalidRegions = inputs.targetRegions.filter(region => !validRegions.includes(region));
        if (invalidRegions.length > 0) {
            tl.setResult(
                tl.TaskResult.Failed,
                `Invalid target regions: ${invalidRegions.join(', ')}. Valid regions: ${validRegions.join(', ')}`
            );
            return false;
        }
    }
    
    // Validate secrets are not empty
    if (!inputs.apiKey || inputs.apiKey.trim() === '') {
        tl.setResult(tl.TaskResult.Failed, 'API Key is required and cannot be empty');
        return false;
    }
    
    if (!inputs.connectionString || inputs.connectionString.trim() === '') {
        tl.setResult(tl.TaskResult.Failed, 'Connection String is required and cannot be empty');
        return false;
    }
    
    tl.debug('✓ All inputs validated successfully');
    return true;
}

/**
 * Logs comprehensive system and environment information
 */
function logSystemInformation(): void {
    tl.debug('=== System Information ===');
    
    // Agent information
    const agentInfo = {
        name: tl.getVariable('Agent.Name'),
        os: tl.getVariable('Agent.OS'),
        version: tl.getVariable('Agent.Version'),
        machineName: tl.getVariable('Agent.MachineName'),
        workFolder: tl.getVariable('Agent.WorkFolder'),
        tempDirectory: tl.getVariable('Agent.TempDirectory')
    };
    
    Object.entries(agentInfo).forEach(([key, value]) => {
        tl.debug(`Agent ${key}: ${value}`);
    });
    
    // Build information
    const buildInfo = {
        buildId: tl.getVariable('Build.BuildId'),
        buildNumber: tl.getVariable('Build.BuildNumber'),
        buildUri: tl.getVariable('Build.BuildUri'),
        definitionName: tl.getVariable('Build.DefinitionName'),
        definitionVersion: tl.getVariable('Build.DefinitionVersion'),
        queuedBy: tl.getVariable('Build.QueuedBy'),
        queuedById: tl.getVariable('Build.QueuedById'),
        reason: tl.getVariable('Build.Reason'),
        requestedFor: tl.getVariable('Build.RequestedFor'),
        requestedForEmail: tl.getVariable('Build.RequestedForEmail'),
        sourceBranch: tl.getVariable('Build.SourceBranch'),
        sourceBranchName: tl.getVariable('Build.SourceBranchName'),
        sourceVersion: tl.getVariable('Build.SourceVersion'),
        stagingDirectory: tl.getVariable('Build.ArtifactStagingDirectory'),
        binariesDirectory: tl.getVariable('Build.BinariesDirectory')
    };
    
    Object.entries(buildInfo).forEach(([key, value]) => {
        tl.debug(`Build ${key}: ${value}`);
    });
    
    // Repository information
    const repoInfo = {
        name: tl.getVariable('Build.Repository.Name'),
        provider: tl.getVariable('Build.Repository.Provider'),
        uri: tl.getVariable('Build.Repository.Uri'),
        localPath: tl.getVariable('Build.Repository.LocalPath'),
        clean: tl.getVariable('Build.Repository.Clean')
    };
    
    Object.entries(repoInfo).forEach(([key, value]) => {
        tl.debug(`Repository ${key}: ${value}`);
    });
    
    // System variables
    const systemInfo = {
        teamFoundationCollectionUri: tl.getVariable('System.TeamFoundationCollectionUri'),
        teamProject: tl.getVariable('System.TeamProject'),
        teamProjectId: tl.getVariable('System.TeamProjectId'),
        defaultWorkingDirectory: tl.getVariable('System.DefaultWorkingDirectory'),
        workFolder: tl.getVariable('System.WorkFolder'),
        hostType: tl.getVariable('System.HostType'),
        culture: tl.getVariable('System.Culture')
    };
    
    Object.entries(systemInfo).forEach(([key, value]) => {
        tl.debug(`System ${key}: ${value}`);
    });
    
    tl.debug('=== End System Information ===');
}

/**
 * Computes derived variables based on inputs and system state
 */
function computeVariables(inputs: VariableTaskInputs): ComputedVariables {
    tl.debug('Computing derived variables...');
    
    const buildNumber = tl.getVariable('Build.BuildNumber') || '1.0.0';
    const buildId = tl.getVariable('Build.BuildId') || '0';
    const sourceBranch = tl.getVariable('Build.SourceBranchName') || 'main';
    const artifactStagingDirectory = tl.getVariable('Build.ArtifactStagingDirectory') || '';
    
    const computedVars: ComputedVariables = {
        // Generate unique deployment ID
        deploymentId: `${inputs.environmentName.toLowerCase()}-${buildId}-${Date.now()}`,
        
        // Build timestamp
        buildTimestamp: new Date().toISOString(),
        
        // Compute version number
        versionNumber: computeVersionNumber(buildNumber, inputs.environmentName),
        
        // Environment prefix for resource naming
        environmentPrefix: getEnvironmentPrefix(inputs.environmentName),
        
        // Output directory based on environment
        outputDirectory: path.join(
            artifactStagingDirectory,
            'deployment',
            inputs.environmentName.toLowerCase(),
            inputs.deploymentSlot
        ),
        
        // Configuration file path
        configurationFile: `config.${inputs.environmentName.toLowerCase()}.${inputs.outputFormat}`,
        
        // Determine if this is a production deployment
        isProductionDeployment: inputs.environmentName.toLowerCase() === 'production',
        
        // Determine if tests should run
        shouldRunTests: !inputs.skipValidation && inputs.environmentName !== 'Production'
    };
    
    // Log computed variables (excluding sensitive data)
    tl.debug(`Computed deployment ID: ${computedVars.deploymentId}`);
    tl.debug(`Computed version number: ${computedVars.versionNumber}`);
    tl.debug(`Environment prefix: ${computedVars.environmentPrefix}`);
    tl.debug(`Output directory: ${computedVars.outputDirectory}`);
    tl.debug(`Configuration file: ${computedVars.configurationFile}`);
    tl.debug(`Is production deployment: ${computedVars.isProductionDeployment}`);
    tl.debug(`Should run tests: ${computedVars.shouldRunTests}`);
    
    return computedVars;
}

/**
 * Computes version number based on build number and environment
 */
function computeVersionNumber(buildNumber: string, environment: string): string {
    // Extract numeric parts from build number
    const parts = buildNumber.split('.');
    const major = parts[0] || '1';
    const minor = parts[1] || '0';
    const patch = parts[2] || '0';
    
    // Add environment-specific suffix
    const envSuffix = getEnvironmentSuffix(environment);
    
    return `${major}.${minor}.${patch}${envSuffix}`;
}

/**
 * Gets environment prefix for resource naming
 */
function getEnvironmentPrefix(environment: string): string {
    const prefixes: { [key: string]: string } = {
        'Development': 'dev',
        'Testing': 'test',
        'Staging': 'stage',
        'Production': 'prod'
    };
    
    return prefixes[environment] || 'unknown';
}

/**
 * Gets environment-specific version suffix
 */
function getEnvironmentSuffix(environment: string): string {
    const suffixes: { [key: string]: string } = {
        'Development': '-dev',
        'Testing': '-test',
        'Staging': '-rc',
        'Production': ''
    };
    
    return suffixes[environment] || '-unknown';
}

/**
 * Sets output variables for subsequent tasks
 */
function setOutputVariables(inputs: VariableTaskInputs, computedVars: ComputedVariables): void {
    tl.debug('Setting output variables...');
    
    // Set computed variables as output variables
    tl.setVariable('DeploymentId', computedVars.deploymentId);
    tl.setVariable('BuildTimestamp', computedVars.buildTimestamp);
    tl.setVariable('VersionNumber', computedVars.versionNumber);
    tl.setVariable('EnvironmentPrefix', computedVars.environmentPrefix);
    tl.setVariable('OutputDirectory', computedVars.outputDirectory);
    tl.setVariable('ConfigurationFile', computedVars.configurationFile);
    
    // Set boolean variables as strings
    tl.setVariable('IsProductionDeployment', computedVars.isProductionDeployment.toString());
    tl.setVariable('ShouldRunTests', computedVars.shouldRunTests.toString());
    
    // Set input-derived variables
    tl.setVariable('TargetEnvironment', inputs.environmentName);
    tl.setVariable('DeploymentSlot', inputs.deploymentSlot);
    tl.setVariable('BuildConfiguration', inputs.buildConfiguration);
    tl.setVariable('LogLevel', inputs.logLevel);
    
    // Set array variables as delimited strings
    if (inputs.targetRegions.length > 0) {
        tl.setVariable('TargetRegions', inputs.targetRegions.join(','));
    }
    
    if (inputs.featureFlags.length > 0) {
        tl.setVariable('FeatureFlags', inputs.featureFlags.join(';'));
    }
    
    // Set secret variables (these will be masked)
    tl.setVariable('ApiKey', inputs.apiKey, true);
    tl.setVariable('ConnectionString', inputs.connectionString, true);
    
    // Set operational parameters
    tl.setVariable('TimeoutMinutes', inputs.timeoutMinutes.toString());
    tl.setVariable('RetryAttempts', inputs.retryAttempts.toString());
    tl.setVariable('ParallelJobs', inputs.parallelJobs.toString());
    
    tl.debug('✓ All output variables set successfully');
}

/**
 * Processes configuration files with variable substitution
 */
async function processConfigurationFiles(
    inputs: VariableTaskInputs, 
    computedVars: ComputedVariables
): Promise<void> {
    
    tl.debug('Processing configuration files...');
    
    try {
        // Ensure output directory exists
        if (!tl.exist(computedVars.outputDirectory)) {
            tl.mkdirP(computedVars.outputDirectory);
        }
        
        // Create configuration object
        const config = {
            environment: {
                name: inputs.environmentName,
                prefix: computedVars.environmentPrefix,
                isProduction: computedVars.isProductionDeployment,
                deploymentSlot: inputs.deploymentSlot
            },
            deployment: {
                id: computedVars.deploymentId,
                version: computedVars.versionNumber,
                timestamp: computedVars.buildTimestamp,
                timeout: inputs.timeoutMinutes,
                retryAttempts: inputs.retryAttempts,
                parallelJobs: inputs.parallelJobs
            },
            features: {
                enableFeatureFlags: inputs.enableFeatureFlags,
                featureFlags: inputs.featureFlags,
                skipValidation: inputs.skipValidation,
                createBackup: inputs.createBackup,
                verboseLogging: inputs.verboseLogging
            },
            targets: {
                regions: inputs.targetRegions,
                excludeFiles: inputs.excludeFiles
            },
            build: {
                configuration: inputs.buildConfiguration,
                buildId: tl.getVariable('Build.BuildId'),
                buildNumber: tl.getVariable('Build.BuildNumber'),
                sourceBranch: tl.getVariable('Build.SourceBranchName'),
                sourceVersion: tl.getVariable('Build.SourceVersion')
            },
            system: {
                agentOs: tl.getVariable('Agent.OS'),
                agentName: tl.getVariable('Agent.Name'),
                teamProject: tl.getVariable('System.TeamProject')
            }
        };
        
        // Write configuration file in requested format
        const configPath = path.join(computedVars.outputDirectory, computedVars.configurationFile);
        
        let configContent: string;
        switch (inputs.outputFormat.toLowerCase()) {
            case 'json':
                configContent = JSON.stringify(config, null, 2);
                break;
            case 'yaml':
                configContent = convertToYaml(config);
                break;
            case 'xml':
                configContent = convertToXml(config);
                break;
            default:
                configContent = JSON.stringify(config, null, 2);
        }
        
        tl.writeFile(configPath, configContent);
        tl.debug(`✓ Configuration file written: ${configPath}`);
        
        // Create variable substitution file
        await createVariableSubstitutionFile(inputs, computedVars);
        
    } catch (error) {
        throw new Error(`Failed to process configuration files: ${error.message}`);
    }
}

/**
 * Creates a variable substitution file for use in deployment templates
 */
async function createVariableSubstitutionFile(
    inputs: VariableTaskInputs, 
    computedVars: ComputedVariables
): Promise<void> {
    
    const substitutionVars = {
        '#{DeploymentId}#': computedVars.deploymentId,
        '#{VersionNumber}#': computedVars.versionNumber,
        '#{EnvironmentName}#': inputs.environmentName,
        '#{EnvironmentPrefix}#': computedVars.environmentPrefix,
        '#{DeploymentSlot}#': inputs.deploymentSlot,
        '#{BuildConfiguration}#': inputs.buildConfiguration,
        '#{LogLevel}#': inputs.logLevel,
        '#{TimeoutMinutes}#': inputs.timeoutMinutes.toString(),
        '#{RetryAttempts}#': inputs.retryAttempts.toString(),
        '#{ParallelJobs}#': inputs.parallelJobs.toString(),
        '#{BuildTimestamp}#': computedVars.buildTimestamp,
        '#{IsProduction}#': computedVars.isProductionDeployment.toString(),
        '#{ShouldRunTests}#': computedVars.shouldRunTests.toString(),
        '#{TargetRegions}#': inputs.targetRegions.join(','),
        '#{FeatureFlags}#': inputs.featureFlags.join(';')
    };
    
    const substitutionContent = Object.entries(substitutionVars)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    
    const substitutionPath = path.join(computedVars.outputDirectory, 'variables.properties');
    tl.writeFile(substitutionPath, substitutionContent);
    
    tl.debug(`✓ Variable substitution file created: ${substitutionPath}`);
}

/**
 * Demonstrates various variable operations
 */
async function demonstrateVariableOperations(
    inputs: VariableTaskInputs, 
    computedVars: ComputedVariables
): Promise<void> {
    
    tl.debug('Demonstrating variable operations...');
    
    // Demonstrate conditional logic based on variables
    const buildReason = tl.getVariable('Build.Reason');
    if (buildReason === 'PullRequest') {
        tl.debug('This is a pull request build - adjusting behavior');
        tl.setVariable('IsPullRequestBuild', 'true');
    } else {
        tl.setVariable('IsPullRequestBuild', 'false');
    }
    
    // Demonstrate environment-specific logic
    if (computedVars.isProductionDeployment) {
        tl.debug('Production deployment detected - enabling additional safeguards');
        tl.setVariable('RequireApproval', 'true');
        tl.setVariable('EnableMonitoring', 'true');
        tl.setVariable('BackupRetentionDays', '30');
    } else {
        tl.setVariable('RequireApproval', 'false');
        tl.setVariable('EnableMonitoring', 'false');
        tl.setVariable('BackupRetentionDays', '7');
    }
    
    // Demonstrate feature flag processing
    if (inputs.enableFeatureFlags && inputs.featureFlags.length > 0) {
        tl.debug(`Processing ${inputs.featureFlags.length} feature flags`);
        for (const flag of inputs.featureFlags) {
            const [flagName, flagValue] = flag.split('=');
            if (flagName && flagValue) {
                tl.setVariable(`FeatureFlag_${flagName}`, flagValue);
                tl.debug(`Set feature flag: ${flagName} = ${flagValue}`);
            }
        }
    }
    
    // Demonstrate dynamic variable computation
    const currentHour = new Date().getHours();
    const isOffHours = currentHour < 6 || currentHour > 22;
    tl.setVariable('IsOffHours', isOffHours.toString());
    
    if (isOffHours) {
        tl.debug('Off-hours deployment detected - adjusting timeouts');
        tl.setVariable('ExtendedTimeout', (inputs.timeoutMinutes * 2).toString());
    }
    
    tl.debug('✓ Variable operations demonstration completed');
}

/**
 * Simple YAML converter (basic implementation)
 */
function convertToYaml(obj: any, indent: number = 0): string {
    const spaces = ' '.repeat(indent);
    let yaml = '';
    
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            yaml += `${spaces}${key}:\n`;
            yaml += convertToYaml(value, indent + 2);
        } else if (Array.isArray(value)) {
            yaml += `${spaces}${key}:\n`;
            for (const item of value) {
                yaml += `${spaces}  - ${item}\n`;
            }
        } else {
            yaml += `${spaces}${key}: ${value}\n`;
        }
    }
    
    return yaml;
}

/**
 * Simple XML converter (basic implementation)
 */
function convertToXml(obj: any, rootName: string = 'configuration'): string {
    function objectToXml(obj: any, name: string): string {
        if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
            let xml = `<${name}>`;
            for (const [key, value] of Object.entries(obj)) {
                xml += objectToXml(value, key);
            }
            xml += `</${name}>`;
            return xml;
        } else if (Array.isArray(obj)) {
            let xml = '';
            for (const item of obj) {
                xml += `<${name}>${item}</${name}>`;
            }
            return xml;
        } else {
            return `<${name}>${obj}</${name}>`;
        }
    }
    
    return `<?xml version="1.0" encoding="UTF-8"?>\n${objectToXml(obj, rootName)}`;
}

// Entry point
if (require.main === module) {
    run().catch((error) => {
        tl.error(`Unhandled error in variables task: ${error}`);
        tl.setResult(tl.TaskResult.Failed, 'Unhandled error in variables task');
        process.exit(1);
    });
}

// Export functions for testing
export { 
    run, 
    getTaskInputs, 
    validateInputs, 
    computeVariables, 
    setOutputVariables,
    processConfigurationFiles 
};