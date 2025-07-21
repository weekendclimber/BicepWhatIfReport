# Azure DevOps UI Component Library Reference

Comprehensive documentation for the `azure-devops-ui` NPM package - the official React component library for building Azure DevOps extensions with native UI consistency.

## 📋 Table of Contents

- [Overview](#overview)
- [Installation & Setup](#installation--setup)
- [Core Components](#core-components)
- [Layout Components](#layout-components)
- [Data Display Components](#data-display-components)
- [Input Components](#input-components)
- [Navigation Components](#navigation-components)
- [Feedback Components](#feedback-components)
- [Styling & Theming](#styling--theming)
- [React 16 Compatibility](#react-16-compatibility)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

## Overview

The `azure-devops-ui` library provides official React components for building Azure DevOps extensions that seamlessly integrate with the Azure DevOps user interface. All components automatically support light/dark themes, responsive design, and accessibility standards.

**Key Benefits:**
- ✅ **Native Azure DevOps styling** - Consistent with platform design
- ✅ **Automatic theme support** - Light/dark mode compatibility  
- ✅ **Built-in accessibility** - ARIA labels, keyboard navigation
- ✅ **Responsive design** - Mobile and desktop friendly
- ✅ **TypeScript support** - Full type definitions included

**Version Compatibility:**
- React: `^16.8.1` (React 16.14.0 recommended)
- azure-devops-ui: `^2.259.0`
- azure-devops-extension-sdk: `^4.0.2`

## Installation & Setup

### Package Installation

```bash
# Install core dependencies
npm install react@^16.14.0 react-dom@^16.14.0
npm install azure-devops-ui@^2.259.0
npm install azure-devops-extension-sdk@^4.0.2

# TypeScript support
npm install --save-dev @types/react@^16.14.0 @types/react-dom@^16.9.0
```

### Project Configuration

#### TypeScript Configuration (tsconfig.json)

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
    "jsx": "react",
    "skipLibCheck": true
  }
}
```

#### Webpack Configuration

```javascript
const path = require('path');

module.exports = {
  entry: './src/index.tsx',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
};
```

### Basic Setup

#### 1. CSS Import (Required)

```typescript
// Import base CSS - REQUIRED for all azure-devops-ui components
import "azure-devops-ui/Core/override.css";
```

#### 2. React App Structure

```typescript
import React from 'react';
import ReactDOM from 'react-dom';
import "azure-devops-ui/Core/override.css";
import { YourComponent } from './YourComponent';

ReactDOM.render(<YourComponent />, document.getElementById('root'));
```

## Core Components

### Header

Professional page headers with consistent Azure DevOps styling.

```typescript
import { Header, TitleSize } from 'azure-devops-ui/Header';

// Basic header
<Header title="My Extension" />

// Advanced header with subtitle and actions
<Header 
  title="Bicep What-If Report"
  titleSize={TitleSize.Large}
  description="Infrastructure deployment preview"
  commandBarItems={[
    {
      id: "refresh",
      text: "Refresh",
      iconProps: { iconName: "Refresh" },
      onActivate: () => handleRefresh()
    }
  ]}
/>
```

**Props:**
- `title: string` - Main header text
- `titleSize?: TitleSize` - Size variant (Small, Medium, Large)
- `description?: string` - Optional subtitle
- `commandBarItems?: IHeaderCommandBarItem[]` - Action buttons

### Card

Collapsible containers for organizing content with proper spacing.

```typescript
import { Card } from 'azure-devops-ui/Card';

// Basic card
<Card titleProps={{ text: "Report Summary" }}>
  <div>Your content here</div>
</Card>

// Collapsible card
<Card 
  titleProps={{ text: "Detailed Results" }}
  collapsible={true}
  collapsed={false}
  onCollapseClick={(isCollapsed) => setCollapsed(isCollapsed)}
>
  <div>Collapsible content</div>
</Card>
```

**Props:**
- `titleProps: ICardTitleProps` - Title configuration
- `collapsible?: boolean` - Enable collapse functionality
- `collapsed?: boolean` - Current collapse state
- `onCollapseClick?: (collapsed: boolean) => void` - Collapse handler

### Spinner

Loading indicators with multiple size variants.

```typescript
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner';

// Basic spinner
<Spinner label="Loading..." />

// Large spinner with custom message
<Spinner 
  size={SpinnerSize.large}
  label="Processing Bicep deployment..."
  ariaLabel="Processing deployment, please wait"
/>
```

**Props:**
- `size?: SpinnerSize` - Size variant (xSmall, small, medium, large)
- `label?: string` - Descriptive text
- `ariaLabel?: string` - Accessibility label

## Layout Components

### Page

Full-page layout container with proper spacing and structure.

```typescript
import { Page } from 'azure-devops-ui/Page';

<Page className="page-content">
  <Header title="My Extension" />
  <div className="page-content-top">
    {/* Main content */}
  </div>
</Page>
```

### Surface

Background containers with elevation and theming.

```typescript
import { Surface, SurfaceBackground } from 'azure-devops-ui/Surface';

<Surface background={SurfaceBackground.callout}>
  <div>Elevated content with callout background</div>
</Surface>
```

## Data Display Components

### MessageBar

Status messages with severity levels and consistent styling.

```typescript
import { MessageBar, MessageBarSeverity } from 'azure-devops-ui/MessageBar';

// Error message
<MessageBar 
  severity={MessageBarSeverity.Error}
  onDismiss={() => setError(null)}
>
  Operation failed: Invalid configuration
</MessageBar>

// Success message
<MessageBar severity={MessageBarSeverity.Success}>
  Deployment completed successfully
</MessageBar>

// Warning with custom styling
<MessageBar 
  severity={MessageBarSeverity.Warning}
  messageClassName="font-family-monospace"
>
  <pre>{warningDetails}</pre>
</MessageBar>
```

**Severity Levels:**
- `MessageBarSeverity.Error` - Red error messages
- `MessageBarSeverity.Warning` - Yellow warning messages  
- `MessageBarSeverity.Info` - Blue informational messages
- `MessageBarSeverity.Success` - Green success messages

### ZeroData

Professional empty state displays with actions.

```typescript
import { ZeroData } from 'azure-devops-ui/ZeroData';

<ZeroData
  primaryText="No reports found"
  secondaryText="Bicep What-If reports will appear here after running the pipeline task"
  imageAltText="No reports available"
  actionText="Learn More"
  actionType={ZeroDataActionType.ctaButton}
  onActionClick={() => window.open('https://docs.microsoft.com/bicep')}
/>
```

### Table

Data tables with sorting, filtering, and selection.

```typescript
import { Table } from 'azure-devops-ui/Table';
import { ArrayItemProvider } from 'azure-devops-ui/Utilities/Provider';

const tableData = [
  { resource: "Storage Account", action: "Create", location: "East US" },
  { resource: "Key Vault", action: "Modify", location: "East US" }
];

<Table
  itemProvider={new ArrayItemProvider(tableData)}
  columns={[
    { id: "resource", name: "Resource", width: 200 },
    { id: "action", name: "Action", width: 100 },
    { id: "location", name: "Location", width: 150 }
  ]}
  containerClassName="h-scroll-auto"
/>
```

## Input Components

### TextField

Text input with validation and formatting.

```typescript
import { TextField } from 'azure-devops-ui/TextField';

<TextField
  value={inputValue}
  onChange={(e, newValue) => setInputValue(newValue)}
  placeholder="Enter configuration name"
  required={true}
  validationError={error ? "Invalid input" : undefined}
/>
```

### Dropdown

Select dropdowns with search and grouping.

```typescript
import { Dropdown } from 'azure-devops-ui/Dropdown';
import { DropdownSelection } from 'azure-devops-ui/Utilities/DropdownSelection';

const options = [
  { id: "dev", text: "Development" },
  { id: "staging", text: "Staging" },
  { id: "prod", text: "Production" }
];

const selection = new DropdownSelection();

<Dropdown
  items={options}
  selection={selection}
  placeholder="Select environment"
  onSelect={(event, item) => handleSelection(item)}
/>
```

### Button

Action buttons with variants and icons.

```typescript
import { Button } from 'azure-devops-ui/Button';
import { ButtonGroup } from 'azure-devops-ui/ButtonGroup';

// Primary button
<Button 
  text="Deploy"
  primary={true}
  onClick={handleDeploy}
  iconProps={{ iconName: "Play" }}
/>

// Button group
<ButtonGroup>
  <Button text="Cancel" />
  <Button text="Save" primary={true} />
</ButtonGroup>
```

## Navigation Components

### Breadcrumb

Navigation breadcrumbs for hierarchical navigation.

```typescript
import { Breadcrumb } from 'azure-devops-ui/Breadcrumb';

const breadcrumbItems = [
  { key: "home", text: "Home", href: "/" },
  { key: "reports", text: "Reports", href: "/reports" },
  { key: "current", text: "Bicep What-If Report" }
];

<Breadcrumb items={breadcrumbItems} />
```

### Tab

Tab navigation for section organization.

```typescript
import { Tab, TabBar, TabSize } from 'azure-devops-ui/Tabs';

<TabBar
  selectedTabId="summary"
  onSelectedTabChanged={setSelectedTab}
  tabSize={TabSize.Tall}
>
  <Tab name="Summary" id="summary" />
  <Tab name="Details" id="details" />
  <Tab name="Logs" id="logs" />
</TabBar>
```

## Feedback Components

### Callout

Contextual popovers and tooltips.

```typescript
import { Callout } from 'azure-devops-ui/Callout';

<Callout
  target={buttonRef}
  onDismiss={() => setShowCallout(false)}
>
  <div className="callout-content">
    Helpful information or actions
  </div>
</Callout>
```

### Dialog

Modal dialogs for important actions.

```typescript
import { Dialog } from 'azure-devops-ui/Dialog';

<Dialog
  titleProps={{ text: "Confirm Deployment" }}
  footerButtonProps={[
    { text: "Cancel", onClick: () => setShowDialog(false) },
    { text: "Deploy", primary: true, onClick: handleConfirm }
  ]}
  onDismiss={() => setShowDialog(false)}
>
  Are you sure you want to deploy these resources?
</Dialog>
```

## Styling & Theming

### Built-in CSS Classes

Azure DevOps UI provides utility classes for consistent styling:

```typescript
// Layout utilities
<div className="flex-grow flex-column">
  <div className="page-content page-content-top">
    <div className="margin-top-16 margin-bottom-16">
      Content with consistent spacing
    </div>
  </div>
</div>

// Typography utilities  
<span className="font-weight-semibold">Important text</span>
<code className="font-family-monospace">Code snippet</code>

// Color utilities (theme-aware)
<div className="primary-color">Theme primary color</div>
<div className="secondary-text">Secondary text color</div>
```

### Custom Theming

Components automatically adapt to Azure DevOps themes:

```typescript
// No theme configuration needed - automatic!
// Components inherit from Azure DevOps theme context

import { Header } from 'azure-devops-ui/Header';
import { Surface, SurfaceBackground } from 'azure-devops-ui/Surface';

// Will automatically use correct colors for current theme
<Surface background={SurfaceBackground.neutral}>
  <Header title="Auto-themed content" />
</Surface>
```

### CSS Override Patterns

When customization is needed:

```css
/* Use CSS custom properties for theme-aware customization */
.custom-component {
  background: var(--surface-background);
  color: var(--text-primary);
  border: 1px solid var(--border-light);
}

/* Component-specific overrides */
.azure-devops-ui-card .card-title {
  font-size: 18px;
  font-weight: 600;
}
```

## React 16 Compatibility

The `azure-devops-ui` library requires React 16.x for compatibility. Here are the key considerations:

### Required Dependencies

```json
{
  "dependencies": {
    "react": "^16.14.0",
    "react-dom": "^16.14.0",
    "azure-devops-ui": "^2.259.0"
  },
  "devDependencies": {
    "@types/react": "^16.14.0",
    "@types/react-dom": "^16.9.0"
  }
}
```

### React 16 vs React 18 Differences

```typescript
// React 16 rendering (REQUIRED for azure-devops-ui)
import ReactDOM from 'react-dom';

ReactDOM.render(<App />, document.getElementById('root'));

// React 18 rendering (NOT compatible with azure-devops-ui)
// import { createRoot } from 'react-dom/client';
// const root = createRoot(document.getElementById('root'));
// root.render(<App />);
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "jsx": "react",  // NOT "react-jsx" (React 17+ feature)
    "lib": ["ES2020", "DOM"]
  }
}
```

## Best Practices

### Component Organization

```typescript
// Organize imports by category
// 1. React imports
import React, { useState, useEffect } from 'react';

// 2. Azure DevOps SDK imports  
import * as SDK from 'azure-devops-extension-sdk';

// 3. Azure DevOps UI imports
import { Header, TitleSize } from 'azure-devops-ui/Header';
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner';
import { MessageBar, MessageBarSeverity } from 'azure-devops-ui/MessageBar';

// 4. Base CSS import
import "azure-devops-ui/Core/override.css";
```

### State Management

```typescript
// Use React hooks effectively with azure-devops-ui
const MyExtension: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);

  // Loading state
  if (loading) {
    return (
      <div className="flex-grow">
        <Header title="My Extension" titleSize={TitleSize.Large} />
        <div className="page-content page-content-top">
          <Spinner 
            size={SpinnerSize.large} 
            label="Loading data..." 
          />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-grow">
        <Header title="My Extension" titleSize={TitleSize.Large} />
        <div className="page-content page-content-top">
          <MessageBar severity={MessageBarSeverity.Error}>
            {error}
          </MessageBar>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="flex-grow">
      <Header title="My Extension" titleSize={TitleSize.Large} />
      <div className="page-content page-content-top">
        {/* Render data */}
      </div>
    </div>
  );
};
```

### Accessibility

```typescript
// Always provide accessibility labels
<Spinner 
  label="Loading reports" 
  ariaLabel="Loading Bicep What-If reports, please wait"
/>

<Button 
  text="Refresh"
  ariaLabel="Refresh the reports list"
  iconProps={{ iconName: "Refresh", ariaLabel: undefined }}
/>

// Use semantic markup
<main role="main" aria-label="Extension content">
  <Header title="Reports" />
  <section aria-label="Report list">
    {/* Content */}
  </section>
</main>
```

### Performance

```typescript
// Lazy load components when appropriate
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

// Memoize expensive computations
const processedData = useMemo(() => {
  return expensiveDataProcessing(rawData);
}, [rawData]);

// Optimize re-renders
const MemoizedCard = React.memo(({ report }: { report: Report }) => (
  <Card titleProps={{ text: report.name }}>
    {report.content}
  </Card>
));
```

## Common Patterns

### Master-Detail View

```typescript
const MasterDetailView: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  return (
    <div className="flex-row h-100">
      {/* Master list */}
      <div className="flex-column" style={{ minWidth: 300 }}>
        <Header title="Items" titleSize={TitleSize.Medium} />
        <div className="page-content">
          {items.map(item => (
            <Card 
              key={item.id}
              titleProps={{ text: item.name }}
              onClick={() => setSelectedItem(item)}
            />
          ))}
        </div>
      </div>
      
      {/* Detail panel */}
      <div className="flex-grow">
        {selectedItem ? (
          <ItemDetail item={selectedItem} />
        ) : (
          <ZeroData 
            primaryText="Select an item"
            secondaryText="Choose an item from the list to view details"
          />
        )}
      </div>
    </div>
  );
};
```

### Search and Filter

```typescript
const SearchableList: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);

  useEffect(() => {
    const filtered = items.filter(item => 
      item.name.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchText, items]);

  return (
    <div className="flex-column">
      <Header title="Search Results" />
      
      <div className="page-content page-content-top">
        <TextField
          value={searchText}
          onChange={(e, value) => setSearchText(value)}
          placeholder="Search items..."
          iconProps={{ iconName: "Search" }}
        />
        
        {filteredItems.length > 0 ? (
          filteredItems.map(item => (
            <Card key={item.id} titleProps={{ text: item.name }}>
              {item.description}
            </Card>
          ))
        ) : (
          <ZeroData 
            primaryText="No matches found"
            secondaryText={`No items match "${searchText}"`}
          />
        )}
      </div>
    </div>
  );
};
```

### Progressive Loading

```typescript
const ProgressiveLoader: React.FC = () => {
  const [loadingStates, setLoadingStates] = useState({
    metadata: true,
    reports: true,
    details: true
  });

  useEffect(() => {
    // Load in stages
    loadMetadata().then(() => {
      setLoadingStates(prev => ({ ...prev, metadata: false }));
      
      return loadReports();
    }).then(() => {
      setLoadingStates(prev => ({ ...prev, reports: false }));
      
      return loadDetails();
    }).then(() => {
      setLoadingStates(prev => ({ ...prev, details: false }));
    });
  }, []);

  return (
    <div className="flex-column">
      <Header title="Loading Content" />
      
      <div className="page-content page-content-top">
        {loadingStates.metadata ? (
          <Spinner label="Loading metadata..." />
        ) : (
          <Card titleProps={{ text: "Metadata" }}>
            Metadata content
          </Card>
        )}
        
        {!loadingStates.metadata && (
          <>
            {loadingStates.reports ? (
              <Spinner label="Loading reports..." />
            ) : (
              <Card titleProps={{ text: "Reports" }}>
                Reports content  
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};
```

## Troubleshooting

### Common Issues

#### Dependency Resolution Errors

```bash
# Error: azure-devops-ui requires React 16.x
npm error peer react@"^16.8.1" from azure-devops-ui@2.259.0

# Solution: Use correct React version
npm install react@^16.14.0 react-dom@^16.14.0
```

#### CSS Import Issues

```typescript
// Error: Components appear unstyled
// Solution: Import base CSS
import "azure-devops-ui/Core/override.css";
```

#### TypeScript Errors

```typescript
// Error: Cannot find module 'azure-devops-ui/Header'
// Solution: Ensure correct import paths
import { Header } from 'azure-devops-ui/Header';  // ✅ Correct
import { Header } from 'azure-devops-ui';        // ❌ Incorrect
```

#### Theme Issues

```typescript
// Components not using Azure DevOps theme
// Solution: Ensure SDK initialization includes applyTheme
await SDK.init({ loaded: false, applyTheme: true });
```

### Debug Techniques

#### Component Inspection

```typescript
// Add debugging info to components
const DebugCard: React.FC<{ title: string }> = ({ title, children }) => {
  console.log('Rendering card:', title);
  
  return (
    <Card 
      titleProps={{ text: `${title} [DEBUG]` }}
      className="debug-border"
    >
      {children}
    </Card>
  );
};
```

#### Theme Detection

```typescript
// Check current theme
useEffect(() => {
  const theme = SDK.getConfiguration()?.theme;
  console.log('Current theme:', theme);
}, []);
```

### Performance Monitoring

```typescript
// Monitor component render performance
const PerformanceCard: React.FC = React.memo(({ data }) => {
  const renderStart = performance.now();
  
  useEffect(() => {
    const renderEnd = performance.now();
    console.log(`Card render time: ${renderEnd - renderStart}ms`);
  });

  return <Card titleProps={{ text: data.title }}>{data.content}</Card>;
});
```

## Additional Resources

### Official Documentation
- [azure-devops-ui npm package](https://www.npmjs.com/package/azure-devops-ui)
- [Azure DevOps Extension SDK](https://github.com/Microsoft/azure-devops-extension-sdk)
- [Azure DevOps Developer Resources](https://developer.microsoft.com/en-us/azure-devops/)

### Component Examples
- [Azure DevOps Extension Samples](https://github.com/Microsoft/azure-devops-extension-samples)
- [Official Component Gallery](https://developer.microsoft.com/en-us/azure-devops/components)

### Community Resources
- [Azure DevOps Developer Community](https://developercommunity.visualstudio.com/spaces/21/index.html)
- [Stack Overflow - azure-devops-ui](https://stackoverflow.com/questions/tagged/azure-devops-ui)

---

*Last updated: July 2025 - Documentation version aligned with azure-devops-ui v2.259.0 and React 16.14.0*