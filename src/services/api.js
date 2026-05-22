import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/authSlice';

/**
 * Centralised Axios instance
 * - All requests automatically attach the JWT from Redux store
 * - 401 responses automatically clear auth state and redirect to /login
 * - Credentials are NEVER stored in localStorage (session-only in Redux)
 */
const api = axios.create({
  baseURL: '/api',           // proxied to http://localhost:5006 by Vite
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,    // JWT-based, not cookie-based
});

// ── Request interceptor: attach Bearer token ──────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 globally ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout());
      window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);

export default api;
