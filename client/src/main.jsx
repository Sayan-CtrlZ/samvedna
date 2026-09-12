import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Support optional external backend URL in production (e.g. Vercel client pointing to Render/Railway backend)
if (import.meta.env.VITE_API_BASE_URL) {
  const originalFetch = window.fetch;
  const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  window.fetch = (input, init) => {
    if (typeof input === 'string' && input.startsWith('/api')) {
      input = `${baseUrl}${input}`;
    }
    return originalFetch(input, init);
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
