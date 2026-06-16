import { KnowledgeBase, ApiResponse, PaginatedResponse, PaginationParams } from '@shared/types';
import { apiClient } from './client';

export async function getKnowledgeBases(params?: PaginationParams): Promise<PaginatedResponse<KnowledgeBase>> {
  const response = await apiClient.get<PaginatedResponse<KnowledgeBase>>('/knowledge-bases', { params });
  return response.data;
}

export async function getKnowledgeBase(id: string): Promise<KnowledgeBase> {
  const response = await apiClient.get<ApiResponse<KnowledgeBase>>(`/knowledge-bases/${id}`);
  return response.data.data;
}

export async function createKnowledgeBase(data: Partial<KnowledgeBase>): Promise<KnowledgeBase> {
  const response = await apiClient.post<ApiResponse<KnowledgeBase>>('/knowledge-bases', data);
  return response.data.data;
}

export async function updateKnowledgeBase(id: string, data: Partial<KnowledgeBase>): Promise<KnowledgeBase> {
  const response = await apiClient.patch<ApiResponse<KnowledgeBase>>(`/knowledge-bases/${id}`, data);
  return response.data.data;
}

export async function deleteKnowledgeBase(id: string): Promise<void> {
  await apiClient.delete(`/knowledge-bases/${id}`);
}

export async function queryKnowledgeBase(id: string, data: { query: string; topK?: number; confidenceThreshold?: number }): Promise<{ results: Array<{ content: string; score: number; source: string }> }> {
  const response = await apiClient.post<ApiResponse<{ results: Array<{ content: string; score: number; source: string }> }>>(`/knowledge-bases/${id}/query`, data);
  return response.data.data;
}
