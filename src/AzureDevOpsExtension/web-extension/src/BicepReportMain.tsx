import 'azure-devops-ui/Core/override.css';
import 'es6-promise/auto';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import BicepReportExtension from './BicepReportExtension';

// SpotCheck pattern: Simple entry point that renders the main component
function showRootComponent(component: React.ReactElement<any>) {
  ReactDOM.render(component, document.getElementById('react-root'));
}

// Initialize and render the application following SpotCheck pattern
showRootComponent(<BicepReportExtension />);
