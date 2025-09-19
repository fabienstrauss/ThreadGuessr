import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { DevMenu } from './components/DevMenu';
import { DEV_MODE, logDevMode } from './config';

// Log current mode to console
logDevMode();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {DEV_MODE ? <DevMenu /> : <App />}
  </StrictMode>
);
