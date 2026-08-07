import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from './app/providers/AppProviders.jsx';
import { SentryBoundary } from './app/providers/SentryBoundary.jsx';
import App from './App.jsx';
import { initSentry } from './shared/monitoring/sentry.js';
import './styles.css';

initSentry();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SentryBoundary>
      <AppProviders>
        <App />
      </AppProviders>
    </SentryBoundary>
  </StrictMode>,
);
