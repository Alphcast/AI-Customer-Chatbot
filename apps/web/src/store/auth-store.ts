import { create } from 'zustand';
import api from '@/lib/api';
import {
  setToken,
  setRefreshToken,
  removeToken,
  removeRefreshToken,
  getToken,
  getRefreshToken,
  isAuthenticated as checkAuth,
  clearAuth,
} from '@/lib/auth';
import type { User, LoginDto, RegisterDto, AuthResponse } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string, refreshToken: string) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: checkAuth(),
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<AuthResponse>('/auth/login', {
        email,
        password,
      } as LoginDto);
      const { user, token, refreshToken } = response.data;
      setToken(token);
      setRefreshToken(refreshToken);
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Login failed';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  loginWithToken: async (token: string, refreshToken: string) => {
    set({ isLoading: true, error: null });
    setToken(token);
    setRefreshToken(refreshToken);
    try {
      const response = await api.get<User>('/auth/me');
      set({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      clearAuth();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Session expired',
      });
    }
  },

  register: async (data: RegisterDto) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<AuthResponse>('/auth/register', data);
      const { user, token, refreshToken } = response.data;
      setToken(token);
      setRefreshToken(refreshToken);
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Registration failed';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  logout: () => {
    const token = getToken();
    const refreshToken = getRefreshToken();
    if (token && refreshToken) {
      api
        .post('/auth/logout', { refreshToken })
        .catch(() => {});
    }
    clearAuth();
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  fetchUser: async () => {
    const token = getToken();
    if (!token) {
      set({ user: null, isAuthenticated: false });
      return;
    }
    set({ isLoading: true });
    try {
      const response = await api.get<User>('/auth/me');
      set({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      clearAuth();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user });
  },

  clearError: () => {
    set({ error: null });
  },
}));
