import { User } from './user.types';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  companyName?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  companyId: string;
  iat: number;
  exp: number;
  type: 'access' | 'refresh';
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface MfaRequest {
  code: string;
  method: 'email' | 'sms' | 'authenticator';
  sessionToken: string;
}

export interface MagicLinkRequest {
  email: string;
  redirectUrl?: string;
}

export interface SessionInfo {
  id: string;
  userId: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  isActive: boolean;
  lastActivityAt: string;
  createdAt: string;
  expiresAt: string;
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  os?: string;
  osVersion?: string;
  browser?: string;
  browserVersion?: string;
  model?: string;
  manufacturer?: string;
}
