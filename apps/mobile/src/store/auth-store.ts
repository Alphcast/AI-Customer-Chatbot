import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '@shared/types';
import { login as apiLogin, register as apiRegister, getProfile } from '@shared/api-client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('auth_token');
  } catch {
    return null;
  }
}

async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync('auth_token', token);
}

async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync('auth_token');
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (data: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response: AuthResponse = await apiLogin(data);
      await setToken(response.accessToken);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Login failed',
      });
    }
  },

  register: async (data: RegisterRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response: AuthResponse = await apiRegister(data);
      await setToken(response.accessToken);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Registration failed',
      });
    }
  },

  logout: async () => {
    await removeToken();
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  fetchUser: async () => {
    try {
      const user = await getProfile();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  restoreSession: async () => {
    const token = await getToken();
    if (token) {
      set({ isLoading: true });
      try {
        const user = await getProfile();
        set({ user, isAuthenticated: true, isLoading: false });
      } catch {
        await removeToken();
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },
}));
