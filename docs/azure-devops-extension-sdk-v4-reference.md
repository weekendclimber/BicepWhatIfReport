# Azure DevOps Extension SDK v4 - Complete Reference Guide

This comprehensive reference guide covers all methods, properties, and patterns for using the Azure DevOps Extension SDK version 4.0.2 in TypeScript and JavaScript applications.

## Table of Contents

1. [Quick Start](#quick-start)
2. [SDK Overview](#sdk-overview)
3. [Core Methods](#core-methods)
4. [Context Information](#context-information)
5. [Service Access](#service-access)
6. [Authentication & Tokens](#authentication--tokens)
7. [Extension Lifecycle](#extension-lifecycle)
8. [UI Integration](#ui-integration)
9. [TypeScript Usage](#typescript-usage)
10. [Migration from Legacy VSS](#migration-from-legacy-vss)
11. [Common Patterns](#common-patterns)
12. [Error Handling](#error-handling)
13. [Troubleshooting](#troubleshooting)

## Quick Start

### Installation

The SDK is available as an npm package:

```bash
npm install azure-devops-extension-sdk
```

### Basic Setup

#### Modern ES6/TypeScript Approach

```typescript
import * as SDK from 'azure-devops-extension-sdk';

// Initialize the extension
SDK.init().then(() => {
    console.log('Extension initialized successfully');
    // Your extension logic here
});
```

#### Browser/Script Tag Approach

```html
<script src="path/to/azure-devops-extension-sdk/SDK.min.js"></script>
<script>
    // Use global SDK object
    SDK.init().then(() => {
        console.log('Extension initialized successfully');
    });
</script>
```

## SDK Overview

The Azure DevOps Extension SDK v4 provides a modern, Promise-based API for developing extensions that integrate with Azure DevOps Services and Azure DevOps Server. It replaces the legacy VSS approach with a cleaner, more maintainable API.

### Key Features

- **Promise-based API**: All async operations return Promises
- **TypeScript Support**: Full type definitions included
- **Service Access**: Easy access to Azure DevOps REST APIs
- **Context Management**: Access to user, project, and host information
- **Authentication**: Built-in token management
- **UI Integration**: Seamless integration with Azure DevOps UI

## Core Methods

### Initialization

#### `init(options?: IExtensionInitOptions): Promise<void>`

Initializes the extension and establishes communication with the host.

```typescript
import * as SDK from 'azure-devops-extension-sdk';

// Basic initialization
await SDK.init();

// With options
await SDK.init({
    loaded: false,     // Extension will call notifyLoadSucceeded() when ready
    applyTheme: true   // Apply Azure DevOps theme to extension content
});
```

**Options:**
- `loaded?: boolean` - Default `true`. Set to `false` if you need to perform async operations before showing the extension
- `applyTheme?: boolean` - Default `true`. Whether to apply the current user's theme

#### `ready(): Promise<void>`

Waits for the SDK to be ready. Alternative to using `init()` when you need to ensure the SDK is initialized.

```typescript
await SDK.ready();
console.log('SDK is ready');
```

### Lifecycle Management

#### `notifyLoadSucceeded(): Promise<void>`

Notifies the host that the extension has loaded successfully. Required when `loaded: false` is used in init options.

```typescript
await SDK.init({ loaded: false });

// Perform your initialization logic
await loadExtensionData();
await setupUI();

// Notify that loading is complete
await SDK.notifyLoadSucceeded();
```

#### `notifyLoadFailed(error: Error | string): Promise<void>`

Notifies the host that the extension failed to load.

```typescript
try {
    await SDK.init();
    await criticalInitialization();
} catch (error) {
    await SDK.notifyLoadFailed(error);
}
```

## Context Information

### User Context

#### `getUser(): IUserContext`

Gets information about the current user.

```typescript
const user = SDK.getUser();
console.log('User ID:', user.id);
console.log('User Name:', user.name);
console.log('Display Name:', user.displayName);
console.log('Email:', user.name);
console.log('Profile Image:', user.imageUrl);
console.log('Descriptor:', user.descriptor);
```

**IUserContext Properties:**
- `id: string` - Unique user identifier
- `name: string` - User name (email/login)
- `displayName: string` - User's display name
- `imageUrl: string` - URL to user's profile image
- `descriptor: string` - Identity descriptor in format `{subject-type}.{base64-encoded-subject-id}`

### Host Context

#### `getHost(): IHostContext`

Gets information about the Azure DevOps host (organization/server).

```typescript
const host = SDK.getHost();
console.log('Organization ID:', host.id);
console.log('Organization Name:', host.name);
console.log('Service Version:', host.serviceVersion);
console.log('Host Type:', host.type); // HostType enum
console.log('Is Hosted (Azure DevOps Services):', host.isHosted);
```

**IHostContext Properties:**
- `id: string` - Unique GUID for the host
- `name: string` - Organization or server name
- `serviceVersion: string` - Azure DevOps version
- `type: HostType` - Host level (Deployment, Enterprise, Organization)
- `isHosted: boolean` - True for Azure DevOps Services, false for Server

**HostType Enum:**
```typescript
enum HostType {
    Unknown = 0,
    Deployment = 1,
    Enterprise = 2,
    Organization = 4
}
```

### Project and Team Context

#### `getWebContext(): IWebContext`

Gets the current web context including project and team information.

```typescript
const webContext = SDK.getWebContext();
if (webContext.project) {
    console.log('Project ID:', webContext.project.id);
    console.log('Project Name:', webContext.project.name);
}
if (webContext.team) {
    console.log('Team ID:', webContext.team.id);
    console.log('Team Name:', webContext.team.name);
}
```

#### `getTeamContext(): ITeamContext`

Gets information about the current team.

```typescript
const team = SDK.getTeamContext();
console.log('Team ID:', team.id);
console.log('Team Name:', team.name);
```

### Page Context

#### `getPageContext(): IPageContext`

Gets comprehensive page context including globalization and timezone information.

```typescript
const pageContext = SDK.getPageContext();
console.log('Culture:', pageContext.globalization.culture);
console.log('Theme:', pageContext.globalization.theme);
console.log('Explicit Theme:', pageContext.globalization.explicitTheme);
console.log('Timezone ID:', pageContext.globalization.timeZoneId);
console.log('Timezone Offset:', pageContext.globalization.timezoneOffset);
```

### Extension Context

#### `getExtensionContext(): IExtensionContext`

Gets information about the current extension.

```typescript
const extension = SDK.getExtensionContext();
console.log('Extension ID:', extension.id); // publisher.extension
console.log('Publisher ID:', extension.publisherId);
console.log('Extension ID (without publisher):', extension.extensionId);
console.log('Extension Version:', extension.version);
```

#### `getContributionId(): string`

Gets the ID of the contribution that caused this extension to load.

```typescript
const contributionId = SDK.getContributionId();
console.log('Contribution ID:', contributionId);
```

#### `getConfiguration(): { [key: string]: any }`

Gets configuration data passed from the host frame.

```typescript
const config = SDK.getConfiguration();
console.log('Build ID:', config.buildId);
console.log('Configuration data:', config);
```

## Service Access

### `getService<T>(contributionId: string): Promise<T>`

Gets a service instance for the specified contribution ID. This is the primary way to access Azure DevOps REST APIs.

#### Common Service IDs

```typescript
// Common service contribution IDs
const ServiceIds = {
    ExtensionData: 'ms.vss-features.extension-data-service',
    Build: 'ms.vss-build-web.build-service',
    WorkItemTracking: 'ms.vss-work-web.work-item-service',
    TestResults: 'ms.vss-test-web.test-result-service',
    Git: 'ms.vss-code-web.git-service',
    ProjectCollection: 'ms.vss-tfs-web.tfs-page-data-service'
};
```

#### Build Service Example

```typescript
interface IBuildService {
    getBuild(projectId: string, buildId: number): Promise<any>;
    getBuildAttachments(projectId: string, buildId: number, type: string): Promise<any[]>;
    getAttachment(projectId: string, buildId: number, type: string, name: string): Promise<string>;
}

async function loadBuildData() {
    const buildService = await SDK.getService<IBuildService>('ms.vss-build-web.build-service');
    const webContext = SDK.getWebContext();
    const config = SDK.getConfiguration();
    
    const buildId = parseInt(config.buildId);
    const build = await buildService.getBuild(webContext.project.id, buildId);
    
    console.log('Build:', build);
    return build;
}
```

#### Extension Data Service Example

```typescript
interface IExtensionDataService {
    getValue<T>(key: string, defaultValue?: T): Promise<T>;
    setValue<T>(key: string, value: T): Promise<T>;
    getDocument(collectionName: string, id: string): Promise<any>;
    setDocument(collectionName: string, doc: any): Promise<any>;
}

async function saveUserPreferences(preferences: any) {
    const dataService = await SDK.getService<IExtensionDataService>('ms.vss-features.extension-data-service');
    await dataService.setValue('userPreferences', preferences);
}

async function loadUserPreferences() {
    const dataService = await SDK.getService<IExtensionDataService>('ms.vss-features.extension-data-service');
    return await dataService.getValue('userPreferences', {});
}
```

#### Work Item Service Example

```typescript
interface IWorkItemService {
    getWorkItem(id: number): Promise<any>;
    updateWorkItem(workItem: any): Promise<any>;
}

async function loadWorkItem(workItemId: number) {
    const workItemService = await SDK.getService<IWorkItemService>('ms.vss-work-web.work-item-service');
    const workItem = await workItemService.getWorkItem(workItemId);
    
    console.log('Work Item:', workItem);
    return workItem;
}
```

## Authentication & Tokens

### `getAccessToken(): Promise<string>`

Fetches an access token for making authenticated calls to Azure DevOps REST APIs.

```typescript
async function callAzureDevOpsApi() {
    const token = await SDK.getAccessToken();
    const host = SDK.getHost();
    
    const response = await fetch(`https://${host.name}/_apis/projects`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    const projects = await response.json();
    return projects;
}
```

### `getAppToken(): Promise<string>`

Fetches a token that can be used to identify the current user.

```typescript
async function getUserIdentityToken() {
    const appToken = await SDK.getAppToken();
    console.log('App Token:', appToken);
    return appToken;
}
```

## Extension Lifecycle

### Registration and Communication

#### `register<T>(instanceId: string, instance: T): void`

Registers an object that the extension exposes to the host frame.

```typescript
// Register a service that the host can call
const myService = {
    doSomething: (data: any) => {
        console.log('Host called doSomething with:', data);
        return { success: true };
    },
    
    getValue: () => {
        return 'Hello from extension';
    }
};

SDK.register('my-service', myService);
```

#### `unregister(instanceId: string): void`

Removes a registered object.

```typescript
SDK.unregister('my-service');
```

## UI Integration

### `resize(width?: number, height?: number): void`

Requests the parent window to resize the container for this extension.

```typescript
// Auto-resize based on content
SDK.resize();

// Specific dimensions
SDK.resize(800, 600);

// Auto-resize when content changes
function resizeToContent() {
    const body = document.body;
    const width = body.scrollWidth;
    const height = body.scrollHeight;
    SDK.resize(width, height);
}

// Call after DOM changes
resizeToContent();
```

### `applyTheme(themeData: { [varName: string]: string }): void`

Applies theme variables to the current document.

```typescript
// Apply custom theme data
const themeData = {
    '--primary-color': '#0078d4',
    '--background-color': '#ffffff',
    '--text-color': '#323130'
};

SDK.applyTheme(themeData);
```

## TypeScript Usage

### Type Definitions

The SDK includes comprehensive TypeScript definitions. Here's how to use them effectively:

```typescript
import * as SDK from 'azure-devops-extension-sdk';

// Type-safe context access
const user: SDK.IUserContext = SDK.getUser();
const host: SDK.IHostContext = SDK.getHost();
const extension: SDK.IExtensionContext = SDK.getExtensionContext();

// Type-safe service access
interface IBuildService {
    getBuild(projectId: string, buildId: number): Promise<Build>;
    getBuildAttachments(projectId: string, buildId: number, type: string): Promise<Attachment[]>;
}

const buildService = await SDK.getService<IBuildService>('ms.vss-build-web.build-service');
```

### Custom Type Definitions

```typescript
// Define your own service interfaces
interface MyExtensionService {
    processData(input: string): Promise<ProcessResult>;
    getSettings(): Promise<ExtensionSettings>;
}

interface ProcessResult {
    success: boolean;
    data: any;
    errors?: string[];
}

interface ExtensionSettings {
    theme: string;
    autoRefresh: boolean;
    refreshInterval: number;
}

// Use with services
const myService = await SDK.getService<MyExtensionService>('my-extension.my-service');
const result = await myService.processData('test data');
```

## Migration from Legacy VSS

### VSS vs SDK Comparison

| Legacy VSS | Modern SDK |
|------------|------------|
| `VSS.init()` | `SDK.init()` |
| `VSS.ready()` | `SDK.ready()` |
| `VSS.getWebContext()` | `SDK.getWebContext()` |
| `VSS.getService()` | `SDK.getService()` |
| `VSS.register()` | `SDK.register()` |

### Migration Examples

#### Before (Legacy VSS)

```javascript
VSS.init({
    explicitNotifyLoaded: true,
    usePlatformStyles: true
});

VSS.ready(() => {
    const webContext = VSS.getWebContext();
    console.log('Project:', webContext.project.name);
    
    VSS.getService(VSS.ServiceIds.ExtensionData).then(dataService => {
        return dataService.getValue('settings');
    }).then(settings => {
        console.log('Settings:', settings);
        VSS.notifyLoadSucceeded();
    });
});
```

#### After (Modern SDK)

```typescript
import * as SDK from 'azure-devops-extension-sdk';

await SDK.init({ loaded: false });

const webContext = SDK.getWebContext();
console.log('Project:', webContext.project.name);

const dataService = await SDK.getService('ms.vss-features.extension-data-service');
const settings = await dataService.getValue('settings');
console.log('Settings:', settings);

await SDK.notifyLoadSucceeded();
```

## Common Patterns

### Extension Loading Pattern

```typescript
import * as SDK from 'azure-devops-extension-sdk';

class MyExtension {
    private buildService: any;
    private dataService: any;
    
    async initialize() {
        try {
            // Initialize SDK
            await SDK.init({ loaded: false });
            
            // Get required services
            this.buildService = await SDK.getService('ms.vss-build-web.build-service');
            this.dataService = await SDK.getService('ms.vss-features.extension-data-service');
            
            // Load initial data
            await this.loadData();
            
            // Setup UI
            this.setupUI();
            
            // Notify successful load
            await SDK.notifyLoadSucceeded();
            
        } catch (error) {
            console.error('Extension initialization failed:', error);
            await SDK.notifyLoadFailed(error);
        }
    }
    
    private async loadData() {
        const config = SDK.getConfiguration();
        if (config.buildId) {
            const webContext = SDK.getWebContext();
            const build = await this.buildService.getBuild(webContext.project.id, config.buildId);
            console.log('Build loaded:', build);
        }
    }
    
    private setupUI() {
        // Setup your UI here
        document.getElementById('content').innerHTML = 'Extension loaded!';
        SDK.resize();
    }
}

// Initialize extension
const extension = new MyExtension();
extension.initialize();
```

### Service Factory Pattern

```typescript
class ServiceFactory {
    private static services = new Map<string, any>();
    
    static async getBuildService() {
        if (!this.services.has('build')) {
            const service = await SDK.getService('ms.vss-build-web.build-service');
            this.services.set('build', service);
        }
        return this.services.get('build');
    }
    
    static async getExtensionDataService() {
        if (!this.services.has('data')) {
            const service = await SDK.getService('ms.vss-features.extension-data-service');
            this.services.set('data', service);
        }
        return this.services.get('data');
    }
}

// Usage
const buildService = await ServiceFactory.getBuildService();
const dataService = await ServiceFactory.getExtensionDataService();
```

### Reactive Data Loading Pattern

```typescript
class DataManager {
    private subscribers: ((data: any) => void)[] = [];
    private cache = new Map<string, any>();
    
    subscribe(callback: (data: any) => void) {
        this.subscribers.push(callback);
    }
    
    private notify(data: any) {
        this.subscribers.forEach(callback => callback(data));
    }
    
    async loadBuildData(buildId: number) {
        const cacheKey = `build-${buildId}`;
        
        if (this.cache.has(cacheKey)) {
            this.notify(this.cache.get(cacheKey));
            return;
        }
        
        try {
            const buildService = await SDK.getService('ms.vss-build-web.build-service');
            const webContext = SDK.getWebContext();
            const build = await buildService.getBuild(webContext.project.id, buildId);
            
            this.cache.set(cacheKey, build);
            this.notify(build);
        } catch (error) {
            console.error('Failed to load build data:', error);
            this.notify({ error: error.message });
        }
    }
}
```

## Error Handling

### Try-Catch Patterns

```typescript
async function safeServiceCall<T>(
    serviceId: string, 
    operation: (service: any) => Promise<T>
): Promise<T | null> {
    try {
        const service = await SDK.getService(serviceId);
        return await operation(service);
    } catch (error) {
        console.error(`Service call failed for ${serviceId}:`, error);
        return null;
    }
}

// Usage
const buildData = await safeServiceCall(
    'ms.vss-build-web.build-service',
    async (buildService) => {
        const webContext = SDK.getWebContext();
        return await buildService.getBuild(webContext.project.id, 123);
    }
);

if (buildData) {
    console.log('Build loaded successfully:', buildData);
} else {
    console.log('Failed to load build data');
}
```

### Error Recovery

```typescript
class ErrorHandler {
    static async withRetry<T>(
        operation: () => Promise<T>,
        maxRetries: number = 3,
        delay: number = 1000
    ): Promise<T> {
        let lastError: Error;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                console.warn(`Attempt ${attempt} failed:`, error);
                
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, delay * attempt));
                }
            }
        }
        
        throw lastError;
    }
}

// Usage
const buildData = await ErrorHandler.withRetry(async () => {
    const buildService = await SDK.getService('ms.vss-build-web.build-service');
    const webContext = SDK.getWebContext();
    return await buildService.getBuild(webContext.project.id, 123);
});
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Extension Not Loading

**Problem**: Extension doesn't initialize or shows loading indefinitely.

**Solution**:
```typescript
// Always handle initialization errors
try {
    await SDK.init({ loaded: false });
    // Your initialization code
    await SDK.notifyLoadSucceeded();
} catch (error) {
    console.error('Initialization failed:', error);
    await SDK.notifyLoadFailed(error);
}
```

#### 2. Service Access Failures

**Problem**: `getService()` calls fail or return undefined.

**Solution**:
```typescript
// Verify service ID and check for typos
const serviceId = 'ms.vss-build-web.build-service';
try {
    const service = await SDK.getService(serviceId);
    if (!service) {
        throw new Error(`Service ${serviceId} not available`);
    }
    // Use service
} catch (error) {
    console.error('Service access failed:', error);
}
```

#### 3. Context Information Missing

**Problem**: Context methods return null or undefined values.

**Solution**:
```typescript
// Always check context availability
const webContext = SDK.getWebContext();
if (!webContext || !webContext.project) {
    console.error('Project context not available');
    return;
}

const user = SDK.getUser();
if (!user) {
    console.error('User context not available');
    return;
}
```

#### 4. Authentication Token Issues

**Problem**: API calls fail with authentication errors.

**Solution**:
```typescript
async function authenticatedFetch(url: string, options: RequestInit = {}) {
    try {
        const token = await SDK.getAccessToken();
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        return await fetch(url, { ...options, headers });
    } catch (error) {
        console.error('Authentication failed:', error);
        throw error;
    }
}
```

### Debug Mode

```typescript
// Enable detailed logging for troubleshooting
const DEBUG = true;

function debugLog(message: string, data?: any) {
    if (DEBUG) {
        console.log(`[Extension Debug] ${message}`, data || '');
    }
}

// Use throughout your extension
debugLog('Extension initializing...');
await SDK.init();
debugLog('SDK initialized');

const user = SDK.getUser();
debugLog('User context:', user);

const webContext = SDK.getWebContext();
debugLog('Web context:', webContext);
```

## Best Practices

1. **Always handle initialization errors** with try-catch blocks
2. **Use TypeScript** for better type safety and IntelliSense
3. **Cache service instances** to avoid repeated `getService()` calls
4. **Check context availability** before using context objects
5. **Implement proper error handling** for all async operations
6. **Use meaningful error messages** for debugging
7. **Test with both Azure DevOps Services and Server** if supporting both
8. **Handle missing or null data gracefully**
9. **Use modern async/await** instead of promise chains
10. **Validate configuration data** from `getConfiguration()`

This completes the comprehensive reference guide for Azure DevOps Extension SDK v4. Use this documentation as your primary reference for building robust Azure DevOps extensions with TypeScript and JavaScript.