import '@fontsource/ia-writer-mono/400.css';
import '@fontsource/ia-writer-mono/400-italic.css';
import '@fontsource/ia-writer-mono/700.css';
import '@fontsource/ia-writer-mono/700-italic.css';
import '@fontsource/ia-writer-duo/400.css';
import '@fontsource/ia-writer-duo/400-italic.css';
import '@fontsource/ia-writer-duo/700.css';
import '@fontsource/ia-writer-duo/700-italic.css';
import '@fontsource/ia-writer-quattro/400.css';
import '@fontsource/ia-writer-quattro/400-italic.css';
import '@fontsource/ia-writer-quattro/700.css';
import '@fontsource/ia-writer-quattro/700-italic.css';
import './styles/app.css';
import './preview/preview.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerServiceWorker } from './pwa';
import { App } from './ui/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

registerServiceWorker();
