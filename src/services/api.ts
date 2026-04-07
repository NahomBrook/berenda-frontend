import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://berenda-backend.vercel.app/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('berenda_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('berenda_token');
      localStorage.removeItem('berenda_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authAPI = {
  register: (data: { email: string; password: string; fullName: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  googleLogin: (idToken: string) =>
    api.post('/auth/google', { idToken }),
};

// ─── User / Profile ───────────────────────────────────────────────────────────

export const userAPI = {
  getProfile: () => api.get('/users/profile'),

  updateProfile: (data: FormData) =>
    api.put('/users/profile', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getSettings: () => api.get('/users/settings'),

  updateSettings: (settings: Record<string, unknown>) =>
    api.put('/users/settings', settings),
};

// ─── Chat ─────────────────────────────────────────────────────────────────────

export const chatAPI = {
  getChats: () => api.get('/chats'),

  createChat: (participantId: string) =>
    api.post('/chats', { participantId }),

  getChatById: (chatId: string) => api.get(`/chats/${chatId}`),

  getMessages: (chatId: string) => api.get(`/chats/${chatId}/messages`),

  sendMessage: (chatId: string, message: string) =>
    api.post(`/chats/${chatId}/messages`, { message }),

  getUnreadCount: () => api.get('/chats/unread'),
};

// ─── AI ───────────────────────────────────────────────────────────────────────

export const aiAPI = {
  sendMessage: (message: string, conversationId?: string) =>
    api.post('/ai/chat', { message, conversationId }),

  clearHistory: () => api.delete('/ai/chat/history'),
};

export default api;
