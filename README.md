# Bicep What-If Report

[![Close Issue](https://github.com/weekendclimber/BicepWhatIfReport/actions/workflows/auto-close-issue.yml/badge.svg)](https://github.com/weekendclimber/BicepWhatIfReport/actions)
[![CodeQL Advanced](https://github.com/weekendclimber/BicepWhatIfReport/actions/workflows/codeql.yml/badge.svg)](https://github.com/weekendclimber/BicepWhatIfReport/actions/workflows/codeql.yml)
[![Dependabot Updates](https://github.com/weekendclimber/BicepWhatIfReport/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/weekendclimber/BicepWhatIfReport/actions/workflows/dependabot/dependabot-updates)

A toolkit for parsing and generating human-readable reports from Bicep deployment "what-if" JSON output. This project offers both an Azure DevOps Extension and a GitHub Action, making it easy to incorporate clear and actionable Bicep change reporting into your CI/CD workflows.

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

## Getting Started

### Prerequisites

- [.NET SDK](https://dotnet.microsoft.com/download) (for Azure DevOps Extension)
- [Node.js](https://nodejs.org/) (for GitHub Action)
- Access to [Bicep CLI](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/install) and Azure subscription for generating what-if output.

---

### 1. Azure DevOps Extension

- **Language Options:** TypeScript/JavaScript (Node.js), PowerShell, or .NET (C#)
- [Documentation and setup instructions](./AzureDevOpsExtension/README.md)

#### Testing

The Azure DevOps Extension includes comprehensive unit tests for the JSON parsing logic:

```bash
cd src/AzureDevOpsExtension/BicepWhatIfReport
npm test
```

**Test Coverage:**
- **16 comprehensive test cases** covering all JSON parsing scenarios
- **Valid JSON parsing:** Multiple change types (Create, Modify, Delete, NoChange, Ignore, Unsupported)
- **Error handling:** Non-existent files, empty files, malformed JSON, permission errors
- **Edge cases:** Large files, deeply nested structures, Unicode content, null values
- **Performance testing:** Time limits and concurrent file access
- **Test data:** Realistic Bicep what-if JSON samples in `tests/test-data/`

### 2. GitHub Action

- **Language Options:** JavaScript/TypeScript (Node.js), or any language via Docker container
- [Documentation and setup instructions](./GitHubAction/README.md)

---

## Issue Tracking & Project Roadmap

The project board and issues are organized around the following milestones:

1. Parse Bicep What-If JSON Output
2. Generate Human-Readable Report
3. Create Azure DevOps Extension Skeleton
4. Implement GitHub Action Skeleton
5. Integrate Report Generation in Azure DevOps Extension
6. Integrate Report Generation in GitHub Action
7. Add Unit Tests for JSON Parsing Logic
8. Add Unit Tests for Report Generation
9. Documentation: Usage Instructions
10. Continuous Integration Setup

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
