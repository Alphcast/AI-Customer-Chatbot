import { User, ApiResponse, PaginatedResponse, PaginationParams } from '@shared/types';
import { apiClient } from './client';

export async function getUsers(params?: PaginationParams): Promise<PaginatedResponse<User>> {
  const response = await apiClient.get<PaginatedResponse<User>>('/users', { params });
  return response.data;
}

export async function getUser(id: string): Promise<User> {
  const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
  return response.data.data;
}

export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  const response = await apiClient.patch<ApiResponse<User>>(`/users/${id}`, data);
  return response.data.data;
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}
