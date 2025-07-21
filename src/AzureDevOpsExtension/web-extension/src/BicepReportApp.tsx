import React from 'react';
import { createRoot } from 'react-dom/client';
import BicepReportExtension from './BicepReportExtension';

// Initialize React app
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('react-root');
  if (container) {
    const root = createRoot(container);
    root.render(<BicepReportExtension />);
  }
});