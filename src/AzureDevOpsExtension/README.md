# Azure DevOps Extension - Bicep What-If Report

This Azure DevOps extension provides a pipeline task and web extension to generate and display human-readable Markdown reports from Bicep What-If JSON output.

## Folder Structure

The extension follows Azure DevOps best practices with clear separation of concerns:

```
src/AzureDevOpsExtension/
├── task/                        # Pipeline task implementation
│   ├── index.ts                 # Main task entry point
│   ├── task.json               # Task definition
│   ├── package.json            # Dependencies and build scripts
│   ├── services/               # Business logic
│   │   └── parseWhatIfJson.ts  # JSON parsing service
│   ├── reports/                # Report generation
│   │   └── generateReport.ts   # Markdown report generator
│   └── tests/                  # Task tests and test data
│       ├── _suite.ts
│       ├── *.test.ts
│       └── test-data/
├── web-extension/              # Web extension for build summary tab
│   ├── src/                      # TypeScript source files  
│   │   ├── BicepReportApp.tsx    # React app entry point
│   │   ├── BicepReportExtension.tsx  # Main React component (azure-devops-ui)
│   │   └── types.ts             # TypeScript interfaces
│   ├── webpack.config.js        # Webpack configuration for React/CSS bundling
│   ├── tsconfig.json           # TypeScript config for extension
│   ├── tsconfig.test.json      # TypeScript config for tests
│   ├── contents/               # Built web assets
│   │   ├── bicep-what-if-tab.html  # Main HTML file
│   │   ├── bicep-what-if-tab.css   # Custom CSS (legacy, minimal usage)
│   │   ├── bicep-report-extension.js  # Webpack bundled React app
│   │   └── scripts/
│   │       └── marked.min.js   # Markdown parsing library
│   └── tests/                  # Web extension tests
│       ├── react-web-extension.test.ts        # React component tests
│       └── azure-devops-ui-integration.test.ts # azure-devops-ui tests
├── images/                     # Extension icons and images
├── vss-extension.json          # Extension manifest
└── README.md                   # This file
```

## Features

- **Pipeline Task**: Generates Markdown reports from Bicep What-If JSON output
- **Web Extension**: Modern React-based UI displaying reports in Azure DevOps build summary tab
  - **Azure DevOps UI Integration**: Uses official `azure-devops-ui` components for consistent styling
  - **Professional Components**: Header, Spinner, MessageBar, Card, and ZeroData components
  - **Responsive Design**: Adapts to Azure DevOps theme and layout standards
- **Artifact Publishing**: Publishes Markdown files as build artifacts for download
- **Output Directory**: Reports are saved to `Build.ArtifactStagingDirectory` by default

## Building and Testing

### Prerequisites
- Node.js 20.x or higher
- npm

### Build the Extension
```bash
# Build the pipeline task
cd task/
npm install
npm run build

# Build the web extension  
cd ../web-extension/
npm install
npm run build
```

This will:
1. Compile the TypeScript task code
2. Compile the React web extension with webpack bundling
3. Process azure-devops-ui CSS and assets
4. Output compiled JavaScript to appropriate locations

### Run Tests
```bash
# Test the pipeline task
cd task/
npm test

# Test the web extension
cd ../web-extension/
npm test
```

The test suite includes:
- **42 task tests**: JSON parsing, report generation, file enumeration
- **19 web extension tests**: React components, azure-devops-ui integration, DOM manipulation

## Azure DevOps UI Integration

The web extension uses the official `azure-devops-ui` library to provide a consistent, professional user experience that aligns with Azure DevOps design standards.

### Components Used

- **Header**: Professional page headers with proper typography and theming
- **Spinner**: Native loading animations with configurable size and labels
- **MessageBar**: Consistent error and information messaging with severity levels
- **Card**: Collapsible content containers for reports with proper spacing
- **ZeroData**: Professional empty state displays with iconography

### Design Benefits

- **Consistency**: Matches native Azure DevOps interface elements
- **Accessibility**: Built-in ARIA labels and keyboard navigation
- **Theming**: Automatically adapts to Azure DevOps light/dark themes  
- **Responsive**: Mobile-friendly responsive design patterns
- **Performance**: Optimized components with minimal bundle size impact

### Technical Implementation

```typescript
// Example component usage
import { Header, TitleSize } from 'azure-devops-ui/Header';
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner';
import { MessageBar, MessageBarSeverity } from 'azure-devops-ui/MessageBar';

// Professional header
<Header title="Bicep What-If Report" titleSize={TitleSize.Large} />

// Loading state
<Spinner 
  size={SpinnerSize.large} 
  label="Loading reports..." 
  ariaLabel="Loading Bicep What-If reports"
/>

// Error display
<MessageBar severity={MessageBarSeverity.Error}>
  {errorMessage}
</MessageBar>
```

### CSS and Styling

The extension imports `azure-devops-ui/Core/override.css` for core styling and uses semantic CSS classes:

- `flex-grow`: Layout containers
- `page-content page-content-top`: Standard page content areas
- `flex-column rhythm-vertical-16`: Vertical spacing patterns
- `font-family-monospace`: Monospace text for error messages

### Package Extension
```bash
# Install tfx-cli globally if not already installed
npm install -g tfx-cli

# Build first
cd task/
npm run build

# Build web extension
cd ../web-extension/
npm run build

# Package from extension root
cd ..
tfx extension create --manifest-globs vss-extension.json
```

This creates a `.vsix` file that can be uploaded to the Visual Studio Marketplace or installed directly in Azure DevOps.

## Usage

1. Add the "Bicep What If Report Task" to your Azure DevOps pipeline
2. Configure the task with the path to your Bicep What-If JSON files
3. View the generated reports in the "Bicep What If Report" tab on the build summary page
4. Download the raw Markdown files from the build artifacts

## Task Configuration

| Input | Description | Required |
|-------|-------------|----------|
| `bicepWhatIfJSONPath` | Path to the Bicep What-If JSON file(s) | Yes |

Example YAML:
```yaml
- task: BicepWhatIfReport@0
  displayName: 'Generate Bicep What-If Report'
  inputs:
    bicepWhatIfJSONPath: '$(System.DefaultWorkingDirectory)/**/what-if-output.json'
```

## Development

### Folder Structure Benefits
- **Clear separation**: Pipeline logic in `task/`, UI logic in `web-extension/`
- **Maintainability**: Easy to locate and modify specific functionality
- **Testing**: Isolated test suites for each component
- **Build process**: Efficient compilation with minimal cross-dependencies

### Adding New Features
- Task functionality: Add to `task/services/` or `task/reports/`
- Web UI features: Add to `web-extension/`
- Tests: Add to respective `tests/` directories
- Build artifacts are automatically excluded via `.gitignore`