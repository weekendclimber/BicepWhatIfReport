# Azure DevOps Extension SDK v4 Documentation

Complete documentation and examples for using the Azure DevOps Extension SDK version 4.0.2 in TypeScript and JavaScript applications.

## 📚 Documentation Files

### Core Reference
- **[Azure DevOps Extension SDK v4 - Complete Reference Guide](azure-devops-extension-sdk-v4-reference.md)**
  - Comprehensive coverage of all SDK methods and properties
  - TypeScript type definitions and usage
  - Best practices and patterns
  - Service access and authentication
  - Context management
  - UI integration and theming

### Migration Guide
- **[Migration Guide: Legacy VSS to Modern SDK v4](migration-guide.md)**
  - Step-by-step migration from legacy VSS approach
  - Comparison between old and new patterns
  - Practical migration examples for the Bicep What-If Report extension
  - Build configuration updates

## 💻 Practical Examples

All examples are located in the [`sdk-examples/`](sdk-examples/) directory:

### 1. [Modern Web Extension](sdk-examples/modern-web-extension.ts)
Complete TypeScript implementation of a modern Azure DevOps web extension:
- Modern initialization patterns with `async/await`
- Comprehensive error handling
- Build service integration
- Attachment processing
- Theme integration
- Auto-resizing and responsive design
- User preference management

### 2. [Build Attachments Example](sdk-examples/build-attachments-example.ts)
Working with build attachments and Azure DevOps services:
- Retrieving build attachments by type
- Downloading and processing attachment content
- Content type detection and validation
- Batch processing with concurrency control
- Error handling for individual attachments
- Export and summary utilities

### 3. [Extension Data Service Example](sdk-examples/extension-data-service-example.ts)
Data persistence and user preferences:
- User preferences management
- Extension state persistence
- Document storage and retrieval
- Search and filtering capabilities
- Data export and import
- Storage statistics and cleanup

### 4. [Theme & UI Integration Example](sdk-examples/theme-and-ui-example.ts)
Theme management and UI integration:
- Automatic theme detection and application
- Dynamic theme switching
- Responsive design patterns
- Auto-resizing functionality
- Theme change detection
- CSS custom properties integration

### 5. [Error Handling Patterns](sdk-examples/error-handling-patterns.ts)
Comprehensive error handling strategies:
- Custom error types and hierarchies
- Retry mechanisms with exponential backoff
- Circuit breaker pattern for failing services
- Graceful degradation strategies
- User-friendly error reporting
- Error logging and diagnostics

## 🚀 Quick Start

### For New Extensions

```typescript
import * as SDK from 'azure-devops-extension-sdk';

async function initializeExtension() {
    try {
        // Initialize SDK
        await SDK.init({ loaded: false, applyTheme: true });
        
        // Get required context
        const webContext = SDK.getWebContext();
        const user = SDK.getUser();
        
        // Get services
        const buildService = await SDK.getService('ms.vss-build-web.build-service');
        
        // Your extension logic here
        
        // Notify successful load
        await SDK.notifyLoadSucceeded();
    } catch (error) {
        console.error('Extension failed to initialize:', error);
        await SDK.notifyLoadFailed(error);
    }
}
```

### For Existing Extensions

1. Review the [Migration Guide](migration-guide.md)
2. Study the [Modern Web Extension Example](sdk-examples/modern-web-extension.ts)
3. Follow the step-by-step migration process
4. Test thoroughly in your Azure DevOps environment

## 📋 Common Patterns

### Service Access
```typescript
// Get a service with proper error handling
const buildService = await SDK.getService<IBuildService>('ms.vss-build-web.build-service');
if (!buildService) {
    throw new Error('Build service not available');
}
```

### Context Validation
```typescript
// Validate required context
const webContext = SDK.getWebContext();
if (!webContext?.project) {
    throw new Error('Project context required');
}
```

### Error Handling
```typescript
try {
    await riskyOperation();
} catch (error) {
    console.error('Operation failed:', error);
    showUserFriendlyError(error.message);
}
```

### Theme Integration
```typescript
// Apply theme automatically
await SDK.init({ applyTheme: true });

// Or apply custom theme
const themeVariables = {
    '--primary-color': '#0078d4',
    '--background-color': '#ffffff'
};
SDK.applyTheme(themeVariables);
```

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- TypeScript 5+
- Azure DevOps Extension SDK v4.0.2

### Installation
```bash
npm install azure-devops-extension-sdk
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true
  }
}
```

## 🔍 Key SDK Methods Reference

| Method | Purpose | Returns |
|--------|---------|---------|
| `SDK.init(options?)` | Initialize extension | `Promise<void>` |
| `SDK.ready()` | Wait for SDK ready | `Promise<void>` |
| `SDK.getUser()` | Get current user info | `IUserContext` |
| `SDK.getWebContext()` | Get web context | `IWebContext` |
| `SDK.getHost()` | Get host info | `IHostContext` |
| `SDK.getService<T>(id)` | Get service instance | `Promise<T>` |
| `SDK.getAccessToken()` | Get auth token | `Promise<string>` |
| `SDK.resize(w?, h?)` | Resize extension | `void` |
| `SDK.applyTheme(vars)` | Apply theme | `void` |

## 📖 Additional Resources

### Official Documentation
- [Azure DevOps Extension SDK Documentation](https://docs.microsoft.com/en-us/azure/devops/extend/develop/add-web-extension)
- [Azure DevOps REST API Reference](https://docs.microsoft.com/en-us/rest/api/azure/devops/)

### Community Resources
- [Azure DevOps Extension Samples](https://github.com/Microsoft/azure-devops-extension-samples)
- [Extension SDK GitHub Repository](https://github.com/Microsoft/azure-devops-extension-sdk)

## 🤝 Contributing

When contributing to this documentation:
1. Follow the existing code style and patterns
2. Include comprehensive TypeScript examples
3. Add error handling patterns
4. Update this index when adding new files
5. Test examples in a real Azure DevOps environment

## 📝 License

This documentation is part of the Bicep What-If Report project and follows the same MIT license terms.