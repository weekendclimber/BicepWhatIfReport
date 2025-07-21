import React from 'react';
import ReactDOM from 'react-dom';
import BicepReportExtension from './BicepReportExtension';

// Initialize React app
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('react-root');
  if (container) {
    ReactDOM.render(<BicepReportExtension />, container);
  }
});
