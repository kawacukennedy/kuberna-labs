export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
  message?: string;
}

export interface ListQueryParams {
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface IdParam {
  id: string;
}

export function parsePagination(query: ListQueryParams): PaginationParams {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '20'), 10)));
  return { page, limit };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit);
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  };
}

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
}

export function errorResponse(message: string, code: string): ApiResponse<never> {
  return {
    success: false,
    error: { message, code },
  };
}

export function validationError(message: string): ApiResponse<never> {
  return errorResponse(message, 'VALIDATION_ERROR');
}

export function notFoundError(resource: string): ApiResponse<never> {
  return errorResponse(`${resource} not found`, 'NOT_FOUND');
}

export function unauthorizedError(message: string = 'Unauthorized'): ApiResponse<never> {
  return errorResponse(message, 'UNAUTHORIZED');
}

export function forbiddenError(message: string = 'Forbidden'): ApiResponse<never> {
  return errorResponse(message, 'FORBIDDEN');
}
