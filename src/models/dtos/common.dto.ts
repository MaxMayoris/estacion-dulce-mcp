/**
 * Common response structures
 */

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: string;
  code: 'VALIDATION' | 'INTERNAL' | 'NOT_FOUND' | 'UNAUTHORIZED';
  details?: string;
}

/**
 * Success response structure
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

/**
 * Generic response type
 */
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;
