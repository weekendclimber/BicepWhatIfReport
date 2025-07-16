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
│   ├── bicep-report-extension.ts  # Main extension code
│   ├── tsconfig.json           # TypeScript config for extension
│   ├── tsconfig.test.json      # TypeScript config for tests
│   ├── contents/               # Web assets
│   │   ├── bicep-what-if-tab.html
│   │   ├── bicep-what-if-tab.css
│   │   └── scripts/
│   │       └── marked.min.js
│   └── tests/                  # Web extension tests
│       ├── _suite.ts
│       └── web-extension.test.ts
├── images/                     # Extension icons and images
├── vss-extension.json          # Extension manifest
└── README.md                   # This file
```

## Features

- **Pipeline Task**: Generates Markdown reports from Bicep What-If JSON output
- **Web Extension**: Displays reports in Azure DevOps build summary tab
- **Artifact Publishing**: Publishes Markdown files as build artifacts for download
- **Output Directory**: Reports are saved to `Build.ArtifactStagingDirectory` by default

## Building and Testing

### Prerequisites
- Node.js 20.x or higher
- npm

### Build the Extension
```bash
cd task/
npm install
npm run build
```

This will:
1. Compile the TypeScript task code
2. Compile the TypeScript web extension code
3. Output compiled JavaScript to appropriate locations

### Run Tests
```bash
cd task/
npm test
```

The test suite includes:
- **42 task tests**: JSON parsing, report generation, file enumeration
- **8 web extension tests**: DOM manipulation, content sanitization, error handling

### Package Extension
```bash
# Install tfx-cli globally if not already installed
npm install -g tfx-cli

# Build first
cd task/
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