# Bicep What-If Report

[![Close Issue](https://github.com/weekendclimber/BicepWhatIfReport/actions/workflows/auto-close-issue.yml/badge.svg)](https://github.com/weekendclimber/BicepWhatIfReport/actions)
[![CodeQL Advanced](https://github.com/weekendclimber/BicepWhatIfReport/actions/workflows/codeql.yml/badge.svg)](https://github.com/weekendclimber/BicepWhatIfReport/actions/workflows/codeql.yml)
[![Continuous Integration](https://github.com/weekendclimber/BicepWhatIfReport/actions/workflows/ci.yml/badge.svg)](https://github.com/weekendclimber/BicepWhatIfReport/actions/workflows/ci.yml)
[![Dependabot Updates](https://github.com/weekendclimber/BicepWhatIfReport/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/weekendclimber/BicepWhatIfReport/actions/workflows/dependabot/dependabot-updates)

A toolkit for parsing and generating human-readable reports from Bicep deployment "what-if" JSON output. This project offers both an Azure DevOps Extension and a GitHub Action, making it easy to incorporate clear and actionable Bicep change reporting into your CI/CD workflows.

---

## Security and Quality Assurance

### GitHub Advanced Security Features

This repository has comprehensive security and quality measures in place:

#### Automated Security Scanning
- **CodeQL Advanced Security**: Automatically scans JavaScript/TypeScript and GitHub Actions for security vulnerabilities
  - Runs on push to main branch, pull requests, and weekly schedule
  - Analyzes code for security vulnerabilities, bugs, and code quality issues
  - Results available in the Security tab

#### Dependency Management
- **Dependabot**: Automatically monitors and updates dependencies
  - Weekly scans for npm packages and GitHub Actions
  - Automatic PR creation for security updates
  - Configured for both Azure DevOps Extension and GitHub Action projects

#### Continuous Integration
- **Automated Testing**: All code changes are automatically tested
  - Runs **50 comprehensive unit tests** for the Azure DevOps Extension
  - **Azure DevOps Extension**: 50 tests covering JSON parsing, report generation, file enumeration, and web extension
  - Tests cover valid parsing, error handling, edge cases, and performance scenarios
  - Matrix testing across Node.js 20.x and 22.x

- **Code Quality**: Enforced through automated linting and formatting
  - ESLint configuration for TypeScript code quality in both projects
  - Prettier for consistent code formatting
  - Pre-commit hooks ensure code quality before tests

- **Build Validation**: Ensures TypeScript compilation succeeds across all projects

#### Security Best Practices
- No hardcoded secrets or sensitive information in source code
- Regular security audits through npm audit
- Minimal permissions for GitHub Actions workflows
- Comprehensive test coverage including security edge cases

---

## Features

- **Parse Bicep What-If JSON:** Robustly handles standard and edge-case outputs from Bicep’s `what-if` operation.
- **Human-Readable Reports:** Generates Markdown or HTML summaries of planned infrastructure changes.
- **Azure DevOps Extension:** Easily integrate into Azure Pipelines to auto-generate and publish reports.
- **GitHub Action:** Add reporting to GitHub PRs and workflows.
- **Unit Tested:** Parsing and reporting logic are covered by automated tests.
- **Cross-Platform:** Flexible language and packaging options for both extension types.

---

## Repository Structure

- **BicepWhatIfReport/**
  - **src/**
    - **AzureDevOpsExtension/**
      - BicepWhatIfReport/
        - services/
          - parseWhatIfJson.ts
        - tests/
          - parseWhatIfJson.test.ts
          - test-data/ (comprehensive JSON test files)
          - _suite.ts
        - reports/
        - index.ts
        - package.json
        - README.md
    - **GitHubAction/**
      - models/
      - services/
      - utils/
      - templates/
      - index.ts
      - action.yml
      - package.json
      - README.md
  - **tests/**
    - AzureDevOpsExtension/
    - GitHubAction/
  - README.md

---

## Documentation

### Azure DevOps Extension SDK v4 Reference
- **[Complete SDK Reference Guide](docs/azure-devops-extension-sdk-v4-reference.md)** - Comprehensive documentation covering all SDK methods, properties, and usage patterns
- **[Practical Examples](docs/sdk-examples/)** - Working TypeScript examples demonstrating real-world SDK usage:
  - [Modern Web Extension](docs/sdk-examples/modern-web-extension.ts) - Complete extension implementation
  - [Build Attachments](docs/sdk-examples/build-attachments-example.ts) - Working with build attachments
  - [Extension Data Service](docs/sdk-examples/extension-data-service-example.ts) - Data persistence and user preferences
  - [Theme & UI Integration](docs/sdk-examples/theme-and-ui-example.ts) - Theme management and responsive design
  - [Error Handling Patterns](docs/sdk-examples/error-handling-patterns.ts) - Comprehensive error handling strategies

## Getting Started

### Prerequisites

- [.NET SDK](https://dotnet.microsoft.com/download) (for Azure DevOps Extension)
- [Node.js](https://nodejs.org/) (for GitHub Action)
- Access to [Bicep CLI](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/install) and Azure subscription for generating what-if output.

---

### 1. Azure DevOps Extension

- **Language Options:** TypeScript/JavaScript (Node.js), PowerShell, or .NET (C#)
- [Documentation and setup instructions](./AzureDevOpsExtension/README.md)

#### Features

- **Pipeline Task**: Generates markdown reports from Bicep what-if JSON output
- **Web Extension**: Displays reports in Azure DevOps build summary tab
- **Artifact Publishing**: Publishes markdown files as build artifacts for download
- **Output Directory**: Reports are saved to `Build.ArtifactStagingDirectory` by default

#### Usage

1. Add the "Bicep What If Report Task" to your Azure DevOps pipeline
2. Configure the task with the path to your Bicep what-if JSON files
3. View the generated reports in the "Bicep What If Report" tab on the build summary page
4. Download the raw markdown files from the build artifacts

#### Testing

The Azure DevOps Extension includes comprehensive unit tests for all functionality:

```bash
cd src/AzureDevOpsExtension/BicepWhatIfReport
npm test
```

**Test Coverage:**
- **50 comprehensive test cases** covering all functionality
- **JSON parsing:** Multiple change types (Create, Modify, Delete, NoChange, Ignore, Unsupported)
- **Report generation:** Unit tests for all helper functions (processChange, processDelta, processValue, processProperties)
- **File enumeration:** Unit tests for getFiles() function (successful enumeration, empty directories, error handling)
- **Web extension:** DOM manipulation, content sanitization, error handling
- **Integration tests:** End-to-end testing of JSON parsing and report generation
- **Error handling:** Non-existent files, empty files, malformed JSON, permission errors
- **Edge cases:** Large files, deeply nested structures, Unicode content, null values
- **Performance testing:** Time limits and concurrent file access
- **Test data:** Realistic Bicep what-if JSON samples in `tests/test-data/`

### 2. GitHub Action

- **Language Options:** JavaScript/TypeScript (Node.js), or any language via Docker container
- [Documentation and setup instructions](./GitHubAction/README.md)

#### Testing

The GitHub Action includes comprehensive unit tests:

```bash
cd src/GitHubAction
npm test
```

**Test Coverage:**
- **8 comprehensive test cases** covering the skeleton implementation
- **Input validation:** Required parameters, error handling for missing inputs
- **Output generation:** Consistent output format and user messaging
- **Error handling:** Unexpected errors, graceful failure modes
- **Mocking:** Proper mocking of @actions/core dependencies
- **Function exports:** Verification of testable function exports

---

## Issue Tracking & Project Roadmap

The project board and issues are organized around the following milestones:

1. ✅ Parse Bicep What-If JSON Output
2. ✅ Generate Human-Readable Report
3. ✅ Create Azure DevOps Extension Skeleton
4. Implement GitHub Action Skeleton
5. ✅ Integrate Report Generation in Azure DevOps Extension
6. Integrate Report Generation in GitHub Action
7. ✅ Add Unit Tests for JSON Parsing Logic
8. Add Unit Tests for Report Generation
9. Documentation: Usage Instructions
10. ✅ Continuous Integration Setup

See [issues](https://github.com/weekendclimber/BicepWhatIfReport/issues) for details.

---

## Contributing

Contributions are welcome! Please open an issue to discuss your idea, fork the repo, and submit a pull request.

---

## License

[MIT](LICENSE)

---

## Acknowledgments

- Inspired by Azure Bicep’s `what-if` functionality
- Thanks to the GitHub and Azure DevOps extension communities
