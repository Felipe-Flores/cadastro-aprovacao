import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  // Usa a variável de ambiente no deploy ou localhost no desenvolvimento
  baseURL: baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL,
});

// Interceptor para injetar o token em todas as requisições automaticamente
api.interceptors.request.use((config) => {
  // Tenta buscar o token que salvamos no login
  const token = localStorage.getItem('access_token');

  if (token) {
    // Anexa o "crachá" no cabeçalho da requisição
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;