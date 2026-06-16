import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { config } from '@shared/config';
import { ERROR_CODES } from '@shared/constants';

interface QueueItem {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });
  failedQueue = [];
}

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(config.auth.tokenKey);
  } catch {
    return null;
  }
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(config.auth.refreshTokenKey);
  } catch {
    return null;
  }
}

function setTokens(accessToken: string, refreshToken: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(config.auth.tokenKey, accessToken);
    localStorage.setItem(config.auth.refreshTokenKey, refreshToken);
  } catch {
    // silently fail
  }
}

function clearTokens() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(config.auth.tokenKey);
    localStorage.removeItem(config.auth.refreshTokenKey);
    localStorage.removeItem(config.auth.userKey);
  } catch {
    // silently fail
  }
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await axios.post(`${config.api.baseUrl}/auth/refresh`, {
    refreshToken,
  });

  const { accessToken, refreshToken: newRefreshToken } = response.data.data;
  setTokens(accessToken, newRefreshToken);
  return accessToken;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (requestConfig: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && requestConfig.headers) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: { code?: string; message?: string } }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const normalizedError = {
      code: error.response?.data?.error?.code || ERROR_CODES.INTERNAL_ERROR,
      message: error.response?.data?.error?.message || error.message || 'An unexpected error occurred',
      status: error.response?.status || 500,
      details: error.response?.data?.error?.details,
    };

    return Promise.reject(normalizedError);
  },
);

export { clearTokens, setTokens };
