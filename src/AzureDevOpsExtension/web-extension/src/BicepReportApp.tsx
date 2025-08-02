import React from 'react';
import ReactDOM from 'react-dom';
import * as SDK from 'azure-devops-extension-sdk';
import BicepReportExtension from './BicepReportExtension';

// Initialize Azure DevOps SDK once at app startup (SpotCheck pattern)
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Initializing Azure DevOps SDK...');

  // Initialize SDK following SpotCheck pattern exactly
  SDK.init();
  await SDK.ready();
  console.log('Azure DevOps SDK ready');

  console.log('Initializing Bicep Report Extension...');
  const container = document.getElementById('react-root');
  if (container) {
    console.log('Rendering BicepReportExtension component...');
    ReactDOM.render(<BicepReportExtension />, container);
  }
});
