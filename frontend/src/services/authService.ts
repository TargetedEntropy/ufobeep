import axios from 'axios';
import { AuthResponse, LoginCredentials, RegisterCredentials, User } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create axios instance with interceptors
const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/register', credentials);
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get('/auth/profile');
    return response.data.user;
  },

  async updateLocation(latitude: number, longitude: number): Promise<void> {
    await apiClient.put('/auth/location', { latitude, longitude });
  },

  async updateNotificationPreferences(preferences: {
    enableNotifications?: boolean;
    notificationRadius?: number;
  }): Promise<void> {
    await apiClient.put('/auth/notifications', preferences);
  },

  async upgradeAnonymousUser(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/upgrade', credentials);
    return response.data;
  },
};

export default apiClient;