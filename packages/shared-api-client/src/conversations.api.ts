import {
  Conversation,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  Message,
} from '@shared/types';
import { apiClient } from './client';

export async function getConversations(params?: PaginationParams): Promise<PaginatedResponse<Conversation>> {
  const response = await apiClient.get<PaginatedResponse<Conversation>>('/chats/conversations', { params });
  return response.data;
}

export async function getConversation(id: string): Promise<Conversation> {
  const response = await apiClient.get<ApiResponse<Conversation>>(`/chats/conversations/${id}`);
  return response.data.data;
}

export async function createConversation(data: Partial<Conversation>): Promise<Conversation> {
  const response = await apiClient.post<ApiResponse<Conversation>>('/chats/conversations', data);
  return response.data.data;
}

export async function updateConversation(id: string, data: Partial<Conversation>): Promise<Conversation> {
  const response = await apiClient.patch<ApiResponse<Conversation>>(`/chats/conversations/${id}`, data);
  return response.data.data;
}

export async function assignAgent(id: string, data: { agentId: string }): Promise<Conversation> {
  const response = await apiClient.post<ApiResponse<Conversation>>(`/chats/conversations/${id}/assign`, data);
  return response.data.data;
}

export async function resolveConversation(id: string): Promise<Conversation> {
  const response = await apiClient.post<ApiResponse<Conversation>>(`/chats/conversations/${id}/resolve`);
  return response.data.data;
}

export async function handoffToAgent(id: string, data: { reason?: string; agentType?: string }): Promise<Conversation> {
  const response = await apiClient.post<ApiResponse<Conversation>>(`/chats/conversations/${id}/handoff`, data);
  return response.data.data;
}

export async function getMessages(conversationId: string, params?: PaginationParams): Promise<PaginatedResponse<Message>> {
  const response = await apiClient.get<PaginatedResponse<Message>>(`/chats/conversations/${conversationId}/messages`, { params });
  return response.data;
}
