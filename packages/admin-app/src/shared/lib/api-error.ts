import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import {
  ERROR_CODES,
  isValidationErrorResponse,
  type IErrorResponse,
  type IValidationErrorResponse,
  type IFieldError,
  type ErrorCode,
} from '@ai-onboarding/shared';

// Re-export для удобства использования
export {
  ERROR_CODES,
  isValidationErrorResponse,
  type IErrorResponse,
  type IValidationErrorResponse,
  type IFieldError,
  type ErrorCode,
};

/**
 * Type guard для проверки FetchBaseQueryError
 */
export function isFetchBaseQueryError(
  error: unknown
): error is FetchBaseQueryError {
  return typeof error === 'object' && error != null && 'status' in error;
}

/**
 * Type guard для проверки SerializedError
 */
export function isSerializedError(error: unknown): error is SerializedError {
  return (
    typeof error === 'object' &&
    error != null &&
    'message' in error &&
    !('status' in error)
  );
}

/**
 * Type guard для проверки структуры IErrorResponse
 */
function isErrorResponseData(data: unknown): data is IErrorResponse {
  return (
    typeof data === 'object' &&
    data != null &&
    'message' in data &&
    typeof (data as Record<string, unknown>).message === 'string' &&
    'code' in data &&
    typeof (data as Record<string, unknown>).code === 'string'
  );
}

/**
 * Извлекает IErrorResponse из ошибки RTK Query
 */
export function getErrorResponse(
  error: FetchBaseQueryError | SerializedError | undefined
): IErrorResponse | null {
  if (!error) return null;

  if (isFetchBaseQueryError(error) && isErrorResponseData(error.data)) {
    return error.data;
  }

  return null;
}

/**
 * Получает человекочитаемое сообщение об ошибке
 */
export function getErrorMessage(
  error: FetchBaseQueryError | SerializedError | undefined,
  defaultMessage = 'An error occurred'
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
 * Получает код ошибки
 */
export function getErrorCode(
  error: FetchBaseQueryError | SerializedError | undefined
): ErrorCode | null {
  const errorResponse = getErrorResponse(error);
  return errorResponse?.code ?? null;
}

/**
 * Получает ошибки валидации по полям
 */
export function getValidationErrors(
  error: FetchBaseQueryError | SerializedError | undefined
): IFieldError[] | null {
  const errorResponse = getErrorResponse(error);

  if (errorResponse && isValidationErrorResponse(errorResponse)) {
    return errorResponse.errors;
  }

  return null;
}

/**
 * Получает ошибку для конкретного поля
 */
export function getFieldError(
  error: FetchBaseQueryError | SerializedError | undefined,
  fieldName: string
): string | null {
  const validationErrors = getValidationErrors(error);

  if (!validationErrors) return null;

  const fieldError = validationErrors.find((e) => e.field === fieldName);
  return fieldError?.message ?? null;
}

/**
 * Преобразует ошибки валидации в формат react-hook-form
 */
export function getFormErrors(
  error: FetchBaseQueryError | SerializedError | undefined
): Record<string, { message: string }> | null {
  const validationErrors = getValidationErrors(error);

  if (!validationErrors) return null;

  return validationErrors.reduce(
    (acc, { field, message }) => {
      acc[field] = { message };
      return acc;
    },
    {} as Record<string, { message: string }>
  );
}

/**
 * Проверяет, является ли ошибка ошибкой аутентификации
 */
export function isAuthError(
  error: FetchBaseQueryError | SerializedError | undefined
): boolean {
  const code = getErrorCode(error);
  return (
    code === ERROR_CODES.UNAUTHORIZED || code === ERROR_CODES.INVALID_CREDENTIALS
  );
}

/**
 * Проверяет, является ли ошибка сетевой
 */
export function isNetworkError(
  error: FetchBaseQueryError | SerializedError | undefined
): boolean {
  if (!error) return false;

  if (isFetchBaseQueryError(error)) {
    return error.status === 'FETCH_ERROR' || error.status === 'TIMEOUT_ERROR';
  }

  return false;
}
