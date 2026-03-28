import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { registerSW } from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register PWA Service Worker (only runs in production build)
registerSW({
  onSuccess: () => console.log('✅ App is ready for offline use.'),
  onUpdate: () => console.log('🔄 New version available. Refresh to update.'),
});

// Measure performance (optional)
reportWebVitals();

