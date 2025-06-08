# Bicep What-If Report

[![CI](https://github.com/weekendclimber/BicepWhatIfReport/actions/workflows/ci.yml/badge.svg)](https://github.com/weekendclimber/BicepWhatIfReport/actions)

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

graph TD
  A[BicepWhatIfReport.sln]
  A --> B[AzureDevOpsExtension]
  A --> C[GitHubAction]

  B --> B1[AzureDevOpsExtension.csproj]
  B --> B2[Program.cs]
  B --> B3[Models/]
  B --> B4[Services/]
  B --> B5[Utils/]
  B --> B6[Reports/]
  B --> B7[Tests/]
  B --> B8[README.md]

  C --> C1[action.yml]
  C --> C2[package.json]
  C --> C3[src/]
  C --> C4[tests/]
  C --> C5[README.md]

  C3 --> C3a[index.js or index.ts]
  C3 --> C3b[models/]
  C3 --> C3c[services/]
  C3 --> C3d[utils/]
  C3 --> C3e[templates/]