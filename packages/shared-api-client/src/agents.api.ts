import { Agent, ApiResponse, PaginatedResponse, PaginationParams } from '@shared/types';
import { apiClient } from './client';

export async function getAgents(params?: PaginationParams): Promise<PaginatedResponse<Agent>> {
  const response = await apiClient.get<PaginatedResponse<Agent>>('/agents', { params });
  return response.data;
}

export async function getAgent(id: string): Promise<Agent> {
  const response = await apiClient.get<ApiResponse<Agent>>(`/agents/${id}`);
  return response.data.data;
}

export async function createAgent(data: Partial<Agent>): Promise<Agent> {
  const response = await apiClient.post<ApiResponse<Agent>>('/agents', data);
  return response.data.data;
}

export async function updateAgent(id: string, data: Partial<Agent>): Promise<Agent> {
  const response = await apiClient.patch<ApiResponse<Agent>>(`/agents/${id}`, data);
  return response.data.data;
}

export async function deleteAgent(id: string): Promise<void> {
  await apiClient.delete(`/agents/${id}`);
}
