export interface TokenStorage {
  getAccessToken(): Promise<string | null>;
  setAccessToken(token: string): Promise<void>;
  getRefreshToken(): Promise<string | null>;
  setRefreshToken(token: string): Promise<void>;
  clearTokens(): Promise<void>;
}

export class WebTokenStorage implements TokenStorage {
  private readonly accessTokenKey: string;
  private readonly refreshTokenKey: string;

  constructor(accessTokenKey = 'access_token', refreshTokenKey = 'refresh_token') {
    this.accessTokenKey = accessTokenKey;
    this.refreshTokenKey = refreshTokenKey;
  }

  async getAccessToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(this.accessTokenKey);
    } catch {
      return null;
    }
  }

  async setAccessToken(token: string): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.accessTokenKey, token);
    } catch {
      // silently fail
    }
  }

  async getRefreshToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(this.refreshTokenKey);
    } catch {
      return null;
    }
  }

  async setRefreshToken(token: string): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.refreshTokenKey, token);
    } catch {
      // silently fail
    }
  }

  async clearTokens(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(this.accessTokenKey);
      localStorage.removeItem(this.refreshTokenKey);
    } catch {
      // silently fail
    }
  }
}

export class SecureTokenStorage implements TokenStorage {
  async getAccessToken(): Promise<string | null> {
    try {
      const SecureStore = require('expo-secure-store');
      return await SecureStore.getItemAsync('access_token');
    } catch {
      return null;
    }
  }

  async setAccessToken(token: string): Promise<void> {
    try {
      const SecureStore = require('expo-secure-store');
      await SecureStore.setItemAsync('access_token', token);
    } catch {
      // silently fail
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      const SecureStore = require('expo-secure-store');
      return await SecureStore.getItemAsync('refresh_token');
    } catch {
      return null;
    }
  }

  async setRefreshToken(token: string): Promise<void> {
    try {
      const SecureStore = require('expo-secure-store');
      await SecureStore.setItemAsync('refresh_token', token);
    } catch {
      // silently fail
    }
  }

  async clearTokens(): Promise<void> {
    try {
      const SecureStore = require('expo-secure-store');
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
    } catch {
      // silently fail
    }
  }
}

export let tokenStorage: TokenStorage = new WebTokenStorage();

export function setTokenStorage(storage: TokenStorage): void {
  tokenStorage = storage;
}
