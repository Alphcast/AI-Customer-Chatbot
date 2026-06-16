export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
  stack?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, string | string[] | undefined>;
}

export type PaginatedResponse<T> = ApiResponse<T[]> & {
  meta: PaginationMeta;
};
