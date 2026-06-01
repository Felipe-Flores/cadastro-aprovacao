import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // Endereço do seu NestJS
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