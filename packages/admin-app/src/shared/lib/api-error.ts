import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

export type ErrorResponse = {
  /** Human-readable error message */
  message: string;
  /** Machine-readable error code */
  code:
    | 'NOT_FOUND'
    | 'VALIDATION_ERROR'
    | 'FORBIDDEN'
    | 'UNAUTHORIZED'
    | 'CONFLICT'
    | 'INVALID_OPERATION'
    | 'LIMIT_EXCEEDED'
    | 'RATE_LIMIT_EXCEEDED'
    | 'BUSINESS_ERROR';
};

/**
 * Type guard to check if error is FetchBaseQueryError
 */
export function isFetchBaseQueryError(
  error: unknown,
): error is FetchBaseQueryError {
  return typeof error === 'object' && error != null && 'status' in error;
}

/**
 * Type guard to check if error is SerializedError
 */
export function isSerializedError(error: unknown): error is SerializedError {
  return typeof error === 'object' && error != null && 'message' in error;
}

/**
 * Extracts ErrorResponse from RTK Query error
 */
export function getErrorResponse(
  error: FetchBaseQueryError | SerializedError | undefined,
): ErrorResponse | null {
  if (!error) return null;

  if (isFetchBaseQueryError(error)) {
    // Check if error.data matches ErrorResponse structure
    if (
      typeof error.data === 'object' &&
      error.data != null &&
      'message' in error.data &&
      'code' in error.data
    ) {
      return error.data as ErrorResponse;
    }
  }

  return null;
}

/**
 * Gets user-friendly error message from RTK Query error
 */
export function getErrorMessage(
  error: FetchBaseQueryError | SerializedError | undefined,
  defaultMessage = 'An error occurred',
): string {
  const errorResponse = getErrorResponse(error);

  if (errorResponse) {
    return errorResponse.message;
  }

  if (isSerializedError(error)) {
    return error.message || defaultMessage;
  }

  if (isFetchBaseQueryError(error)) {
    if (error.status === 'FETCH_ERROR') {
      return 'Network error. Please check your connection.';
    }
    if (error.status === 'PARSING_ERROR') {
      return 'Error parsing server response.';
    }
    if (error.status === 'TIMEOUT_ERROR') {
      return 'Request timeout. Please try again.';
    }
    if (typeof error.status === 'number') {
      return `Server error: ${error.status}`;
    }
  }

  return defaultMessage;
}

/**
 * Gets error code from RTK Query error
 */
export function getErrorCode(
  error: FetchBaseQueryError | SerializedError | undefined,
): ErrorResponse['code'] | null {
  const errorResponse = getErrorResponse(error);
  return errorResponse?.code || null;
}
