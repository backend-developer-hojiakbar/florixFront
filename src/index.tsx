import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App'; // Changed to aliased, extensionless import

// Initialize Telegram Web App with static background
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        setBackgroundColor: (color: string) => void;
      };
    };
  }
}

// Set static background color for Telegram Web App
if (window.Telegram?.WebApp) {
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.setBackgroundColor('#e0f2f7');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);