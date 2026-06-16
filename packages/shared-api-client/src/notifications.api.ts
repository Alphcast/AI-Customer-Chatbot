import { Notification, ApiResponse, PaginatedResponse, PaginationParams } from '@shared/types';
import { apiClient } from './client';

export async function getNotifications(params?: PaginationParams): Promise<PaginatedResponse<Notification>> {
  const response = await apiClient.get<PaginatedResponse<Notification>>('/notifications', { params });
  return response.data;
}

export async function getUnreadCount(): Promise<{ count: number }> {
  const response = await apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
  return response.data.data;
}

export async function markAsRead(id: string): Promise<Notification> {
  const response = await apiClient.patch<ApiResponse<Notification>>(`/notifications/${id}/read`);
  return response.data.data;
}

export async function markAllAsRead(): Promise<{ message: string }> {
  const response = await apiClient.patch<ApiResponse<{ message: string }>>('/notifications/read-all');
  return response.data.data;
}

export async function deleteNotification(id: string): Promise<void> {
  await apiClient.delete(`/notifications/${id}`);
}
