import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const repoService = {
  upload: (repo_url) => api.post('/repo/upload', { repo_url }),
  list: () => api.get('/repo/list'),
};

export const chatService = {
  ask: (repoId, query) => api.post('/chat/ask', { repoId, query }),
  getHistory: (repoId) => api.get(`/chat/history/${repoId}`),
};

export default api;
