import { Message, ApiResponse } from '@shared/types';
import { apiClient } from './client';

export async function sendMessage(data: {
  conversationId: string;
  content: string;
  type?: string;
  attachments?: Array<{ url: string; fileName: string; fileSize: number; mimeType: string }>;
  parentId?: string;
}): Promise<Message> {
  const response = await apiClient.post<ApiResponse<Message>>('/messages', data);
  return response.data.data;
}

export async function getMessage(id: string): Promise<Message> {
  const response = await apiClient.get<ApiResponse<Message>>(`/messages/${id}`);
  return response.data.data;
}

export async function deleteMessage(id: string): Promise<void> {
  await apiClient.delete(`/messages/${id}`);
}

export async function markAsRead(id: string): Promise<Message> {
  const response = await apiClient.patch<ApiResponse<Message>>(`/messages/${id}/read`);
  return response.data.data;
}

export async function uploadFile(conversationId: string, file: File): Promise<{ url: string; fileName: string; fileSize: number; mimeType: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<ApiResponse<{ url: string; fileName: string; fileSize: number; mimeType: string }>>(
    `/messages/${conversationId}/files`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return response.data.data;
}
