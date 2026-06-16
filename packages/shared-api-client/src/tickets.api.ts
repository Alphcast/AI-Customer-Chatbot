import { Ticket, ApiResponse, PaginatedResponse, PaginationParams, InternalNote } from '@shared/types';
import { apiClient } from './client';

export async function getTickets(params?: PaginationParams): Promise<PaginatedResponse<Ticket>> {
  const response = await apiClient.get<PaginatedResponse<Ticket>>('/tickets', { params });
  return response.data;
}

export async function getTicket(id: string): Promise<Ticket> {
  const response = await apiClient.get<ApiResponse<Ticket>>(`/tickets/${id}`);
  return response.data.data;
}

export async function createTicket(data: Partial<Ticket>): Promise<Ticket> {
  const response = await apiClient.post<ApiResponse<Ticket>>('/tickets', data);
  return response.data.data;
}

export async function updateTicket(id: string, data: Partial<Ticket>): Promise<Ticket> {
  const response = await apiClient.patch<ApiResponse<Ticket>>(`/tickets/${id}`, data);
  return response.data.data;
}

export async function deleteTicket(id: string): Promise<void> {
  await apiClient.delete(`/tickets/${id}`);
}

export async function addNote(ticketId: string, data: { content: string; isPrivate?: boolean }): Promise<InternalNote> {
  const response = await apiClient.post<ApiResponse<InternalNote>>(`/tickets/${ticketId}/notes`, data);
  return response.data.data;
}

export async function getNotes(ticketId: string): Promise<InternalNote[]> {
  const response = await apiClient.get<ApiResponse<InternalNote[]>>(`/tickets/${ticketId}/notes`);
  return response.data.data;
}

export async function assignTicket(id: string, data: { agentId: string }): Promise<Ticket> {
  const response = await apiClient.post<ApiResponse<Ticket>>(`/tickets/${id}/assign`, data);
  return response.data.data;
}

export async function resolveTicket(id: string): Promise<Ticket> {
  const response = await apiClient.post<ApiResponse<Ticket>>(`/tickets/${id}/resolve`);
  return response.data.data;
}
