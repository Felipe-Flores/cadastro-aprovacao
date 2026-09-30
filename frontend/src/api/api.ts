import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  // Usa a variável de ambiente no deploy ou localhost no desenvolvimento
  baseURL: baseURL,
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

// Diferença entre o relógio do servidor e o do navegador (evita erro se a hora da máquina estiver errada)
let serverOffsetMs = 0;

const sincronizarRelogio = (headers?: Record<string, unknown>) => {
  const serverDate = Date.parse(String(headers?.['date'] ?? ''));
  if (!Number.isNaN(serverDate)) serverOffsetMs = serverDate - Date.now();
};

export const agoraServidor = () => Date.now() + serverOffsetMs;

api.interceptors.response.use(
  (response) => {
    sincronizarRelogio(response.headers);
    return response;
  },
  (error) => {
    sincronizarRelogio(error.response?.headers);
    return Promise.reject(error);
  },
);

export default api;