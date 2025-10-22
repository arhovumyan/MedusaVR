import "./index.css";     

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { ImageBlurProvider } from "./context/ImageBlurContext";
import { measurePageLoad, observeWebVitals, preloadCriticalResources } from "./lib/performance";
import { HelmetProvider } from "react-helmet-async";

// Initialize performance monitoring
observeWebVitals();
preloadCriticalResources();

// Global error handler for React DOM manipulation errors
window.addEventListener('error', (event) => {
  // Suppress React DOM manipulation errors that are preventing the app from working
  if (event.error && event.error.message) {
    const message = event.error.message.toLowerCase();
    if (message.includes('insertbefore') || 
        message.includes('removechild') || 
        message.includes('not a child of this node')) {
      console.warn('🛡️ Suppressed React DOM manipulation error:', event.error.message);
      event.preventDefault();
      return false;
    }
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error(' Unhandled promise rejection:', event.reason);
  // Don't prevent default - let React handle it properly
});

// Measure page load performance after everything is loaded
window.addEventListener('load', () => {
  setTimeout(() => {
    measurePageLoad();
  }, 0);
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ImageBlurProvider>
          <App />
        </ImageBlurProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
