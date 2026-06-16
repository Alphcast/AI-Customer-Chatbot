import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config } from '@shared/config';
import { WebTokenStorage } from '@shared/auth';

const isServer = typeof window === 'undefined';
const tokenStorage = isServer ? null : new WebTokenStorage();

interface FailedRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const api = axios.create({
  baseURL: config.api.baseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: config.api.timeout,
});

api.interceptors.request.use(
  (requestConfig: InternalAxiosRequestConfig) => {
    const token = tokenStorage?.getToken();
    if (token && requestConfig.headers) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = tokenStorage?.getRefreshToken();
    if (!refreshToken) {
      tokenStorage?.clear();
      if (!isServer) window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data.data || response.data;
      tokenStorage?.setToken(accessToken || response.data.token);
      if (newRefreshToken || response.data.refreshToken) {
        tokenStorage?.setRefreshToken(newRefreshToken || response.data.refreshToken);
      }
      processQueue(null, accessToken || response.data.token);
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${accessToken || response.data.token}`;
      }
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      tokenStorage?.clear();
      if (!isServer) window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
