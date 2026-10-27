import axios from 'axios';

/**
 * Centralized Axios client instance configured for HttpOnly cookie sessions.
 * In development, defaults to '/api/v1' using Vite local proxy.
 * In production on Vercel, uses VITE_API_URL pointing to the live Render backend API.
 */
const rawApiUrl = import.meta.env.VITE_API_URL;
const baseURL = rawApiUrl
  ? (rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api/v1`)
  : '/api/v1';

const apiClient = axios.create({
  baseURL,
  withCredentials: true, // Strictly ensures cookies are sent and received cross-origin
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
