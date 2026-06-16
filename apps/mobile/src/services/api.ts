import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { config } from '@shared/config';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

const api = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  async (requestConfig: InternalAxiosRequestConfig) => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token && requestConfig.headers) {
        requestConfig.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore
    }
    return requestConfig;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
    return Promise.reject(error);
  },
);

export default api;
