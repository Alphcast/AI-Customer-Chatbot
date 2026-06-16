import { Document, ApiResponse, PaginatedResponse, PaginationParams } from '@shared/types';
import { apiClient } from './client';

export async function uploadDocument(file: File, data: { knowledgeBaseId: string; title?: string; description?: string }): Promise<Document> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('knowledgeBaseId', data.knowledgeBaseId);
  if (data.title) formData.append('title', data.title);
  if (data.description) formData.append('description', data.description);
  const response = await apiClient.post<ApiResponse<Document>>('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}

export async function getDocuments(params?: PaginationParams): Promise<PaginatedResponse<Document>> {
  const response = await apiClient.get<PaginatedResponse<Document>>('/documents', { params });
  return response.data;
}

export async function getDocument(id: string): Promise<Document> {
  const response = await apiClient.get<ApiResponse<Document>>(`/documents/${id}`);
  return response.data.data;
}

export async function deleteDocument(id: string): Promise<void> {
  await apiClient.delete(`/documents/${id}`);
}

export async function reprocessDocument(id: string): Promise<Document> {
  const response = await apiClient.post<ApiResponse<Document>>(`/documents/${id}/reprocess`);
  return response.data.data;
}
