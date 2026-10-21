import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles/app.css';
import App from './App.jsx';
import { legacyPagePaths } from './navigation.js';

window.__ELARCA_REACT_ROUTER__ = true;
window.__ELARCA_PAGE_PATHS__ = legacyPagePaths;

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then((registration) => {
      console.info('[PWA] Service Worker registrado:', registration.scope);
    })
    .catch((error) => {
      console.warn('[PWA] No se pudo registrar el Service Worker:', error);
    });
}

// Legacy page scripts attach non-idempotent DOM listeners during route changes.
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
