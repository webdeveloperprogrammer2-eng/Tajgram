import axios from 'axios';
import { ApiResponse, UserProfile } from '../types/auth.types';

const BASE_URL = 'https://instagram-back-qibs.onrender.com';

export const authApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT token to header automatically
authApi.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  async register(payload: any): Promise<ApiResponse<string>> {
    const response = await authApi.post<ApiResponse<string>>('/Account/register', payload);
    return response.data;
  },

  async login(payload: any): Promise<ApiResponse<string>> {
    const response = await authApi.post<ApiResponse<string>>('/Account/login', payload);
    return response.data;
  },

  async getMyProfile(): Promise<ApiResponse<UserProfile>> {
    const response = await authApi.get<ApiResponse<UserProfile>>('/UserProfile/get-my-profile');
    return response.data;
  },
};
