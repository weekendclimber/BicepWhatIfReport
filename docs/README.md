# Azure DevOps Development Documentation

Complete documentation and practical examples for developing Azure DevOps extensions and pipeline tasks using Microsoft's official SDKs and libraries.

## 📚 Documentation Overview

This documentation covers two distinct development paths:

1. **Web Extensions** - Interactive UI components that run in the Azure DevOps browser interface
2. **Pipeline Tasks** - Custom build/release tasks that run on Azure DevOps agents

## 📖 Core Documentation

### Azure DevOps Extension SDK v4 (Web Extensions)
- **[Complete Reference Guide](azure-devops-extension-sdk-v4-reference.md)** - Comprehensive SDK documentation
- **[Migration Guide](migration-guide.md)** - Migrate from legacy VSS to modern SDK v4
- **[Getting Started](index.md)** - Quick start guide and common patterns

### Azure Pipelines Task Library (Pipeline Tasks)
- **[Complete Reference Guide](azure-pipelines-task-lib-reference.md)** - Comprehensive task library documentation

## 💻 Practical Examples

All examples are located in the **[`sdk-examples/`](sdk-examples/)** directory and include complete, working TypeScript implementations.

### Web Extension Examples
| Example | Description | Key Features |
|---------|-------------|--------------|
| [Modern Web Extension](sdk-examples/modern-web-extension.ts) | Complete modern extension implementation | Async/await patterns, error handling, service integration |
| [Build Attachments](sdk-examples/build-attachments-example.ts) | Working with build attachments | Attachment processing, content handling, batch operations |
| [Extension Data Service](sdk-examples/extension-data-service-example.ts) | Data persistence and user preferences | State management, document storage, search capabilities |
| [Theme & UI Integration](sdk-examples/theme-and-ui-example.ts) | Theme management and responsive design | Auto-theming, dynamic styling, responsive patterns |
| [Error Handling Patterns](sdk-examples/error-handling-patterns.ts) | Advanced error handling strategies | Custom errors, retry logic, graceful degradation |

### Pipeline Task Examples
| Example | Description | Key Features |
|---------|-------------|--------------|
| [Basic Pipeline Task](sdk-examples/pipeline-task-basic-example.ts) | Fundamental task structure and patterns | Input validation, logging, task results |
| [File Operations](sdk-examples/pipeline-task-file-operations.ts) | Comprehensive file processing | File discovery, processing, progress reporting |
| [Variables & Inputs](sdk-examples/pipeline-task-variables-example.ts) | Input and variable management | All input types, system variables, output variables |
| [Artifacts & Attachments](sdk-examples/pipeline-task-artifacts-example.ts) | Build artifact management | Artifact creation, attachments, metadata generation |
| [Error Handling](sdk-examples/pipeline-task-error-handling.ts) | Advanced error handling and resilience | Retry patterns, circuit breakers, error categorization |

## 🚀 Quick Start Guides

### Creating a Web Extension

```typescript
import * as SDK from 'azure-devops-extension-sdk';

async function initializeExtension() {
    try {
        // Initialize SDK with theme support
        await SDK.init({ loaded: false, applyTheme: true });
        
        // Get required context and services
        const webContext = SDK.getWebContext();
        const buildService = await SDK.getService('ms.vss-build-web.build-service');
        
        // Your extension logic here
        
        // Notify successful load
        await SDK.notifyLoadSucceeded();
    } catch (error) {
        console.error('Extension initialization failed:', error);
        await SDK.notifyLoadFailed(error);
    }
}
```

### Creating a Pipeline Task

```typescript
import tl = require('azure-pipelines-task-lib/task');

async function run(): Promise<void> {
    try {
        // Get and validate inputs
        const sourceDir = tl.getInputRequired('sourceDirectory');
        const config = tl.getInput('configuration') || 'Release';
        
        // Validate inputs
        if (!tl.exist(sourceDir)) {
            tl.setResult(tl.TaskResult.Failed, `Source directory not found: ${sourceDir}`);
            return;
        }
        
        // Perform task operations
        await performWork(sourceDir, config);
        
        // Report success
        tl.setResult(tl.TaskResult.Succeeded, 'Task completed successfully');
        
    } catch (error) {
        tl.error(`Task failed: ${error.message}`);
        tl.setResult(tl.TaskResult.Failed, error.message);
    }
}

run();
```

## 🔧 Development Setup

### Prerequisites
- **Node.js 18+** - JavaScript runtime
- **TypeScript 5+** - Type-safe JavaScript
- **Azure DevOps Extension SDK v4.0.2** - For web extensions
- **Azure Pipelines Task Library v5.2.1** - For pipeline tasks

### Installation

```bash
# For web extensions
npm install azure-devops-extension-sdk azure-devops-ui

# For pipeline tasks  
npm install azure-pipelines-task-lib

# Development dependencies
npm install typescript @types/node
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
    "strict": true,
    "declaration": true,
    "outDir": "./dist"
  }
}
```

## 📋 Key Concepts

### Web Extensions vs Pipeline Tasks

| Aspect | Web Extensions | Pipeline Tasks |
|--------|----------------|----------------|
| **Runtime** | Browser (Azure DevOps UI) | Build/Release Agent |
| **Language** | TypeScript/JavaScript + HTML/CSS | TypeScript/JavaScript (Node.js) |
| **SDK** | azure-devops-extension-sdk | azure-pipelines-task-lib |
| **Purpose** | UI components, dashboards, hubs | Build automation, custom tasks |
| **Context** | Web browser, user interaction | Command line, automated execution |
| **Installation** | Extension marketplace | Task library |

### Common Patterns

#### Input Validation
```typescript
// Web Extension
const config = SDK.getConfiguration();
if (!config.project) {
    throw new Error('Project context required');
}

// Pipeline Task
const input = tl.getInputRequired('requiredInput');
if (!tl.exist(input)) {
    tl.setResult(tl.TaskResult.Failed, 'Input path does not exist');
}
```

#### Error Handling
```typescript
// Web Extension
try {
    await riskyOperation();
} catch (error) {
    console.error('Operation failed:', error);
    showUserFriendlyError(error.message);
}

// Pipeline Task
try {
    await riskyOperation();
} catch (error) {
    tl.error(`Operation failed: ${error.message}`);
    tl.setResult(tl.TaskResult.Failed, error.message);
}
```

#### Service Integration
```typescript
// Web Extension
const buildService = await SDK.getService<IBuildService>('ms.vss-build-web.build-service');
const builds = await buildService.getBuilds(project.id);

// Pipeline Task
const buildId = tl.getVariable('Build.BuildId');
const buildNumber = tl.getVariable('Build.BuildNumber');
```

## 📚 API References

### Essential Web Extension APIs
- `SDK.init()` - Initialize extension
- `SDK.getWebContext()` - Get project/user context
- `SDK.getService()` - Access Azure DevOps services
- `SDK.getConfiguration()` - Get extension configuration
- `SDK.resize()` - Resize extension frame

### Essential Pipeline Task APIs
- `tl.getInput()` - Get task inputs
- `tl.setResult()` - Set task completion status
- `tl.uploadArtifact()` - Upload build artifacts
- `tl.addAttachment()` - Add build attachments
- `tl.getVariable()` - Access pipeline variables

## 🌟 Best Practices

### Security
- Never expose secrets in web extensions
- Use secure storage for sensitive data
- Validate all inputs thoroughly
- Implement proper error handling

### Performance
- Use async/await patterns consistently
- Implement proper loading states
- Minimize API calls and batch operations
- Use efficient data structures

### Maintainability
- Follow TypeScript best practices
- Write comprehensive tests
- Document complex logic
- Use consistent naming conventions

### User Experience
- Provide clear error messages
- Implement progress indicators
- Support keyboard navigation
- Follow Azure DevOps design guidelines

## 🔗 Additional Resources

### Official Documentation
- [Azure DevOps Extension Development](https://docs.microsoft.com/en-us/azure/devops/extend/)
- [Azure Pipelines Task Development](https://docs.microsoft.com/en-us/azure/devops/extend/develop/add-build-task)
- [Azure DevOps REST API](https://docs.microsoft.com/en-us/rest/api/azure/devops/)

### GitHub Repositories
- [Azure DevOps Extension SDK](https://github.com/Microsoft/azure-devops-extension-sdk)
- [Azure Pipelines Task Library](https://github.com/Microsoft/azure-pipelines-task-lib)
- [Azure DevOps Extension Samples](https://github.com/Microsoft/azure-devops-extension-samples)

### Community Resources
- [Azure DevOps Developer Community](https://developercommunity.visualstudio.com/spaces/21/index.html)
- [Azure DevOps Extension Marketplace](https://marketplace.visualstudio.com/azuredevops)

## 🤝 Contributing

When contributing to this documentation:

1. **Follow existing patterns** - Maintain consistency with current structure
2. **Include complete examples** - Provide working, testable code
3. **Add comprehensive comments** - Explain complex concepts and APIs
4. **Test thoroughly** - Verify examples work in real Azure DevOps environments
5. **Update indexes** - Keep navigation and cross-references current

## 📝 License

This documentation is part of the Bicep What-If Report project and follows the same license terms.

---

*Last updated: [Date] - Documentation version aligned with Azure DevOps Extension SDK v4.0.2 and Azure Pipelines Task Library v5.2.1*