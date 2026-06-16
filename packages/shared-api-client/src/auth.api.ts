import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenRequest,
  MfaRequest,
  MagicLinkRequest,
  ApiResponse,
  User,
} from '@shared/types';
import { apiClient } from './client';

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
  return response.data.data;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
  return response.data.data;
}

export async function refreshToken(data: RefreshTokenRequest): Promise<AuthResponse> {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/refresh', data);
  return response.data.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function forgotPassword(data: { email: string }): Promise<{ message: string }> {
  const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/forgot-password', data);
  return response.data.data;
}

export async function resetPassword(data: { token: string; password: string }): Promise<{ message: string }> {
  const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/reset-password', data);
  return response.data.data;
}

export async function getProfile(): Promise<User> {
  const response = await apiClient.get<ApiResponse<User>>('/auth/me');
  return response.data.data;
}

export async function updateProfile(data: Partial<User>): Promise<User> {
  const response = await apiClient.patch<ApiResponse<User>>('/auth/me', data);
  return response.data.data;
}

export async function changePassword(data: { oldPassword: string; newPassword: string }): Promise<{ message: string }> {
  const response = await apiClient.patch<ApiResponse<{ message: string }>>('/auth/change-password', data);
  return response.data.data;
}

export async function verifyMfa(data: MfaRequest): Promise<AuthResponse> {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/mfa/verify', data);
  return response.data.data;
}

export async function sendMagicLink(data: MagicLinkRequest): Promise<{ message: string }> {
  const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/magic-link', data);
  return response.data.data;
}
