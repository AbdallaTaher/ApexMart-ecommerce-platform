import axios from 'axios';

/**
 * Centralized Axios client instance configured for HttpOnly cookie sessions
 */
const apiClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // Strictly ensures cookies are sent and received cross-origin / via proxy
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
