/**
 * Standardized error response structure
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    stack?: string;
    details?: any;
  };
  timestamp: string;
  path?: string;
}

/**
 * Error codes
 */
export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL = 'INTERNAL',
  FORBIDDEN = 'FORBIDDEN',
  BAD_REQUEST = 'BAD_REQUEST'
}

/**
 * Create standardized error response
 * @param code - Error code
 * @param message - Error message
 * @param error - Original error object (optional)
 * @param path - Request path (optional)
 * @returns ErrorResponse object
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  error?: Error | unknown,
  path?: string
): ErrorResponse {
  const response: ErrorResponse = {
    error: {
      code,
      message,
    },
    timestamp: new Date().toISOString(),
    ...(path && { path })
  };

  // Add stack trace in DEV environment
  if (process.env.ENV === 'DEV' && error instanceof Error) {
    response.error.stack = error.stack;
  }

  // Add error details if available
  if (error && typeof error === 'object') {
    response.error.details = {
      name: (error as Error).name,
      ...(error as any).cause && { cause: (error as any).cause }
    };
  }

  // Log error details server-side
  console.error('Error Response:', {
    code,
    message,
    timestamp: response.timestamp,
    ...(error instanceof Error && { 
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack 
    })
  });

  return response;
}

/**
 * Create HTTP Response from ErrorResponse
 * @param errorResponse - ErrorResponse object
 * @param statusCode - HTTP status code
 * @returns HTTP Response
 */
export function createHttpErrorResponse(
  errorResponse: ErrorResponse,
  statusCode: number = 500
): Response {
  return new Response(
    JSON.stringify(errorResponse, null, 2),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
