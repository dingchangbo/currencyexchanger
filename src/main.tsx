import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Guard against third-party cross-origin script errors bubbling to host environment
if (typeof window !== 'undefined') {
  window.addEventListener(
    'error',
    (event) => {
      if (
        event.message === 'Script error.' ||
        event.message?.includes('Script error') ||
        (event.filename &&
          (event.filename.includes('disqus') ||
            event.filename.includes('disquscdn')))
      ) {
        event.preventDefault?.();
        return true;
      }
    },
    true
  );

  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = String(event.reason || '');
    if (
      reasonStr.includes('Script error') ||
      reasonStr.includes('disqus') ||
      reasonStr.includes('disquscdn')
    ) {
      event.preventDefault?.();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

