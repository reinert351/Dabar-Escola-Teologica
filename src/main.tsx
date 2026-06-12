import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ignora e suprime os alertas inofensivos de WebSocket do Vite no sandbox
if (typeof window !== 'undefined') {
  const isWebsocketError = (msg: string) => {
    const lower = msg.toLowerCase();
    return lower.includes('websocket') || 
           lower.includes('vite') || 
           lower.includes('connection established') || 
           lower.includes('fechado sem') ||
           lower.includes('closed before');
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (reason) {
      const msg = String(reason.message || reason);
      if (isWebsocketError(msg)) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  });

  window.addEventListener('error', (event) => {
    const msg = String(event.message || '');
    if (isWebsocketError(msg)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

