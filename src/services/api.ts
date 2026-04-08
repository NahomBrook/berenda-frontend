import axios from 'axios';

// Primary backend is on Render; Vercel URL is the legacy/fallback
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://berenda-backend-ow7d.onrender.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000, // Render free-tier may cold-start; give 20 s
});

// Attach auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('berenda_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally (expired / invalid token)
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

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authAPI = {
  register: (data: { email: string; password: string; fullName: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  googleLogin: (idToken: string) =>
    api.post('/auth/google', { idToken }),
};

// ── User / Profile ────────────────────────────────────────────────────────────

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

// ── Properties ────────────────────────────────────────────────────────────────

export const propertyAPI = {
  list: (params?: Record<string, string | number>) =>
    api.get('/properties', { params }),

  search: (params: Record<string, string | number>) =>
    api.get('/properties/search', { params }),

  getById: (id: string) => api.get(`/properties/${id}`),

  getMyProperties: () => api.get('/properties/user/properties'),

  create: (data: Record<string, unknown>) =>
    api.post('/properties', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/properties/${id}`, data),

  delete: (id: string) => api.delete(`/properties/${id}`),

  uploadImages: (propertyId: string, files: FormData) =>
    api.post(`/properties/${propertyId}/images`, files, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  checkAvailability: (
    propertyId: string,
    data: { checkIn: string; checkOut: string; guests: number }
  ) => api.post(`/properties/${propertyId}/check-availability`, data),
};

// ── Bookings ──────────────────────────────────────────────────────────────────

export const bookingAPI = {
  getMyBookings: () => api.get('/bookings'),

  getHostBookings: () => api.get('/bookings/host'),

  getById: (id: string) => api.get(`/bookings/${id}`),

  create: (data: {
    propertyId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    totalPrice?: number;
  }) => api.post('/bookings', data),

  cancel: (id: string) => api.patch(`/bookings/${id}/cancel`),

  updateStatus: (id: string, status: string) =>
    api.patch(`/bookings/${id}/status`, { status }),
};

// ── Payments ──────────────────────────────────────────────────────────────────

export const paymentAPI = {
  initialize: (data: Record<string, unknown>) =>
    api.post('/payments/initialize', data),

  verify: (txRef: string) => api.get(`/payments/verify/${txRef}`),
};

// ── Favorites ────────────────────────────────────────────────────────────────

export const favoritesAPI = {
  list: () => api.get('/favorites'),

  add: (propertyId: string) => api.post('/favorites', { propertyId }),

  remove: (propertyId: string) => api.delete(`/favorites/${propertyId}`),
};

// ── Chat ──────────────────────────────────────────────────────────────────────

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

// ── AI ────────────────────────────────────────────────────────────────────────

export const aiAPI = {
  sendMessage: (message: string, conversationId?: string) =>
    api.post('/ai/chat', { message, conversationId }),

  clearHistory: () => api.delete('/ai/chat/history'),
};

// ── Admin ────────────────────────────────────────────────────────────────────

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),

  getUsers: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/admin/users', { params }),

  getUserById: (userId: string) => api.get(`/admin/users/${userId}`),

  updateUserRole: (userId: string, roleName: string) =>
    api.patch(`/admin/users/${userId}/role`, { roleName }),

  deleteUser: (userId: string) => api.delete(`/admin/users/${userId}`),

  getProperties: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/admin/properties', { params }),

  approveProperty: (propertyId: string) =>
    api.patch(`/admin/properties/${propertyId}/approve`),

  rejectProperty: (propertyId: string, reason?: string) =>
    api.patch(`/admin/properties/${propertyId}/reject`, { reason }),

  deleteProperty: (propertyId: string) =>
    api.delete(`/admin/properties/${propertyId}`),

  getBookings: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/admin/bookings', { params }),

  updateBookingStatus: (bookingId: string, status: string) =>
    api.patch(`/admin/bookings/${bookingId}/status`, { status }),

  getActions: () => api.get('/admin/actions'),
};

export default api;
