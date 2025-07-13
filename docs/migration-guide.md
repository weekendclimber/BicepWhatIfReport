# Migration Guide: Legacy VSS to Modern SDK v4

This guide shows how to migrate the existing Bicep What-If Report web extension from the legacy VSS approach to the modern Azure DevOps Extension SDK v4.

## Current Implementation Analysis

The current `bicep-what-if-tab.html` uses the legacy VSS global object approach:

```javascript
// Legacy VSS approach (current implementation)
VSS.init({
    explicitNotifyLoaded: true,
    usePlatformStyles: true
});

VSS.ready(() => {
    const webContext = VSS.getWebContext();
    VSS.getService(VSS.ServiceIds.ExtensionData).then(dataService => {
        // Handle service...
    });
});
```

## Recommended Migration Path

### Step 1: Create Modern TypeScript Implementation

Replace the inline JavaScript with a proper TypeScript module:

**File: `src/AzureDevOpsExtension/web-extension/bicep-report-extension.ts`**

```typescript
import * as SDK from 'azure-devops-extension-sdk';

interface IBuildService {
    getBuild(projectId: string, buildId: number): Promise<any>;
    getBuildAttachments(projectId: string, buildId: number, type: string): Promise<any[]>;
    getAttachment(projectId: string, buildId: number, type: string, name: string): Promise<string>;
}

class BicepReportExtension {
    private buildService?: IBuildService;

    async initialize(): Promise<void> {
        try {
            // Modern SDK initialization
            await SDK.init({ loaded: false, applyTheme: true });
            
            // Get services
            this.buildService = await SDK.getService<IBuildService>('ms.vss-build-web.build-service');
            
            // Load and display reports
            await this.loadReports();
            
            // Notify successful load
            await SDK.notifyLoadSucceeded();
            
        } catch (error) {
            console.error('Extension initialization failed:', error);
            await SDK.notifyLoadFailed(error);
        }
    }

    private async loadReports(): Promise<void> {
        const webContext = SDK.getWebContext();
        const config = SDK.getConfiguration();
        
        if (!webContext.project || !config.buildId) {
            throw new Error('Required context not available');
        }

        const buildId = parseInt(config.buildId);
        const attachments = await this.buildService!.getBuildAttachments(
            webContext.project.id,
            buildId,
            'bicepwhatifreport'
        );

        const reports = attachments.filter(att => att.name.startsWith('md/'));
        
        if (reports.length === 0) {
            this.showNoReports();
            return;
        }

        await this.displayReports(reports, webContext.project.id, buildId);
    }

    private async displayReports(attachments: any[], projectId: string, buildId: number): Promise<void> {
        const reportList = document.getElementById('report-list')!;
        
        for (const attachment of attachments) {
            const content = await this.buildService!.getAttachment(
                projectId,
                buildId,
                'bicepwhatifreport',
                attachment.name
            );
            
            const reportElement = this.createReportElement(attachment.name, content);
            reportList.appendChild(reportElement);
        }

        document.getElementById('loading')!.style.display = 'none';
        document.getElementById('content')!.style.display = 'block';
        
        // Auto-resize to fit content
        SDK.resize();
    }

    private createReportElement(name: string, content: string): HTMLElement {
        const li = document.createElement('li');
        li.className = 'report-item';

        const details = document.createElement('details');
        const summary = document.createElement('summary');
        
        const displayName = name.replace('md/', '').replace(/\^[0-9]+/g, '');
        summary.textContent = displayName;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'markdown-content';
        
        // Use marked library if available
        if (typeof (window as any).marked !== 'undefined') {
            contentDiv.innerHTML = (window as any).marked.parse(content);
        } else {
            const pre = document.createElement('pre');
            pre.textContent = content;
            contentDiv.appendChild(pre);
        }

        details.appendChild(summary);
        details.appendChild(contentDiv);
        li.appendChild(details);

        return li;
    }

    private showNoReports(): void {
        document.getElementById('loading')!.style.display = 'none';
        document.getElementById('content')!.style.display = 'block';
        document.getElementById('no-reports')!.style.display = 'block';
        SDK.resize();
    }
}

// Initialize extension
document.addEventListener('DOMContentLoaded', () => {
    const extension = new BicepReportExtension();
    extension.initialize();
});
```

### Step 2: Update HTML File

**File: `src/AzureDevOpsExtension/contents/bicep-what-if-tab.html`**

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>Bicep What-If Report</title>
    <style>
        /* Existing CSS styles remain the same */
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        /* ... rest of existing styles ... */
    </style>
</head>
<body>
    <!-- Existing HTML structure remains the same -->
    <div class="container">
        <div class="header">
            <h1>Bicep What-If Report</h1>
        </div>
        
        <div id="loading" class="loading">
            Loading Bicep What-If reports...
        </div>
        
        <div id="error" class="error" style="display: none;"></div>
        
        <div id="content" class="report-content" style="display: none;">
            <div id="no-reports" class="no-reports" style="display: none;">
                No Bicep What-If reports found for this build.
            </div>
            <ul id="report-list" class="report-list"></ul>
        </div>
    </div>

    <!-- Load SDK v4 instead of legacy VSS -->
    <script src="../BicepWhatIfReport/node_modules/azure-devops-extension-sdk/SDK.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    
    <!-- Load compiled TypeScript extension -->
    <script src="../web-extension/bicep-report-extension.js"></script>
</body>
</html>
```

### Step 3: Update Build Configuration

**File: `src/AzureDevOpsExtension/BicepWhatIfReport/tsconfig.json`**

Add web extension compilation:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": [
    "**/*.ts",
    "../web-extension/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "tests"
  ]
}
```

**File: `src/AzureDevOpsExtension/BicepWhatIfReport/package.json`**

Update build script:

```json
{
  "scripts": {
    "build": "tsc && npm run build:web",
    "build:web": "tsc --project ../web-extension/tsconfig.json",
    "dev": "npm run build && node ./index.js",
    "watch": "tsc --watch",
    "watch:web": "tsc --watch --project ../web-extension/tsconfig.json"
  }
}
```

### Step 4: Create Web Extension Build Configuration

**File: `src/AzureDevOpsExtension/web-extension/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "outDir": "../contents",
    "rootDir": "."
  },
  "include": ["*.ts"],
  "exclude": ["node_modules"]
}
```

## Migration Benefits

### Before (Legacy VSS)
- Global VSS object dependency
- Callback-based promise chains
- No TypeScript support
- Limited error handling
- Inline JavaScript in HTML

### After (Modern SDK v4)
- Modular TypeScript implementation
- Modern async/await patterns
- Full type safety
- Comprehensive error handling
- Separated concerns (HTML/TypeScript)
- Better testing capabilities
- Modern build pipeline

## Key Differences

| Feature | Legacy VSS | Modern SDK v4 |
|---------|------------|---------------|
| Import | Global `VSS` object | `import * as SDK` |
| Initialization | `VSS.init()` + `VSS.ready()` | `await SDK.init()` |
| Service Access | `VSS.getService(VSS.ServiceIds.X)` | `await SDK.getService('service-id')` |
| Context | `VSS.getWebContext()` | `SDK.getWebContext()` |
| Error Handling | Try/catch in callbacks | Async/await with proper error handling |
| Type Safety | None | Full TypeScript support |

## Testing the Migration

1. **Build the TypeScript**:
   ```bash
   cd src/AzureDevOpsExtension/BicepWhatIfReport
   npm run build
   ```

2. **Test in Azure DevOps**:
   - Package and upload the extension
   - Navigate to a build with Bicep What-If reports
   - Verify the "Bicep What-If Report" tab loads correctly

3. **Verify Functionality**:
   - Reports load and display properly
   - Markdown rendering works
   - Error handling provides user feedback
   - UI resizes appropriately

## Rollback Plan

If issues arise, you can quickly rollback by:

1. Reverting the HTML file to use the original inline JavaScript
2. Keeping the old VSS-based script as a backup
3. Switching the script src back to the legacy implementation

This migration provides a solid foundation for future enhancements while maintaining backward compatibility and improving maintainability.