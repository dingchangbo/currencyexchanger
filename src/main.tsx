import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Non-invasive error guard for third-party cross-origin scripts
if (typeof window !== 'undefined') {
  const prevOnError = window.onerror;
  window.onerror = function (msg, url, lineNo, columnNo, error) {
    if (
      msg === 'Script error.' ||
      (typeof msg === 'string' && msg.includes('Script error')) ||
      (typeof url === 'string' && (url.includes('disqus') || url.includes('disquscdn')))
    ) {
      return true;
    }
    if (prevOnError) {
      return prevOnError(msg, url, lineNo, columnNo, error);
    }
    return false;
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

