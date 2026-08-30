import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { API_ORIGIN } from './config/api';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';

// 🔐 ማንኛውም fetch() ጥሪ ወደ backend (API_ORIGIN) ሲላክ Authorization header በራሱ ይጨመርለታል
const originalFetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
  const url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : input.url);
  if (url.startsWith(API_ORIGIN)) {
    const token = localStorage.getItem('staff_token');
    if (token) {
      init = {
        ...init,
        headers: {
          ...(init.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      };
    }
  }
  return originalFetch(input as any, init);
};

// 🔐 ማንኛውም axios ጥሪ ላይም ተመሳሳይ Authorization header ራሱ ይጨመርለታል (MerchantStatusCenter.tsx የሚጠቀምበት)
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('staff_token');
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
