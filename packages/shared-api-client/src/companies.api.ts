import { Company, ApiResponse, PaginationParams, PaginatedResponse } from '@shared/types';
import { apiClient } from './client';

export async function getCompanies(params?: PaginationParams): Promise<PaginatedResponse<Company>> {
  const response = await apiClient.get<PaginatedResponse<Company>>('/companies', { params });
  return response.data;
}

export async function getCompany(id: string): Promise<Company> {
  const response = await apiClient.get<ApiResponse<Company>>(`/companies/${id}`);
  return response.data.data;
}

export async function updateCompany(id: string, data: Partial<Company>): Promise<Company> {
  const response = await apiClient.patch<ApiResponse<Company>>(`/companies/${id}`, data);
  return response.data.data;
}
