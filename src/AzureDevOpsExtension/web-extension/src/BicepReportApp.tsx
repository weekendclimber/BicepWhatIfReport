import React from 'react';
import ReactDOM from 'react-dom';
import BicepReportExtension from './BicepReportExtension';

// Initialize React app
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing Bicep Report Extension...');
  const container = document.getElementById('react-root');
  if (container) {
    console.log('Rendering BicepReportExtension component...');
    ReactDOM.render(<BicepReportExtension />, container);
  }
});
