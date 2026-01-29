import {
  isRejectedWithValue,
  type Middleware,
  type UnknownAction,
} from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';
import {
  getErrorResponse,
  isNetworkError,
  isFetchBaseQueryError,
  ERROR_CODES,
} from './api-error';
import { addToast } from '../ui';

type RTKError = FetchBaseQueryError | SerializedError | undefined;

/**
 * Тип для callback обработки ошибок
 */
export interface ErrorHandlerCallbacks {
  /** Обработка ошибки аутентификации (редирект на логин) */
  onAuthError?: () => void;
  /** Обработка сетевой ошибки */
  onNetworkError?: () => void;
  /** Кастомная обработка для конкретных кодов ошибок. Return true чтобы подавить стандартную обработку */
  onErrorCode?: (code: string, message: string) => boolean;
}

/**
 * Конфигурация middleware
 */
export interface ErrorMiddlewareConfig {
  /** Эндпоинты, для которых НЕ показывать автоматические тосты */
  silentEndpoints?: string[];
  /** Коды ошибок, для которых НЕ показывать автоматические тосты */
  silentErrorCodes?: string[];
  /** Колбэки для обработки ошибок */
  callbacks?: ErrorHandlerCallbacks;
}

// Хранилище конфигурации
let middlewareConfig: ErrorMiddlewareConfig = {
  silentEndpoints: [],
  silentErrorCodes: [],
  callbacks: {},
};

/**
 * Настройка middleware извне
 */
export function configureErrorMiddleware(config: ErrorMiddlewareConfig): void {
  middlewareConfig = { ...middlewareConfig, ...config };
}

/**
 * Установка колбэков для обработки ошибок
 */
export function setErrorHandlerCallbacks(
  callbacks: ErrorHandlerCallbacks,
): void {
  middlewareConfig.callbacks = { ...middlewareConfig.callbacks, ...callbacks };
}

/**
 * Показать toast с ошибкой через dispatch
 */
function showErrorToast(
  dispatch: (action: UnknownAction) => void,
  message: string,
  title?: string,
): void {
  dispatch(
    addToast({
      title: title || 'Error',
      description: message,
      variant: 'error',
      placement: 'top-center',
    }),
  );
}

/**
 * Проверяет, является ли action rejected action от RTK Query
 */
function isRTKQueryRejectedAction(action: unknown): action is UnknownAction & {
  payload?: unknown;
  error?: { message?: string };
  meta?: { arg?: { endpointName?: string }; baseQueryMeta?: unknown };
} {
  if (typeof action !== 'object' || action === null) return false;
  const act = action as Record<string, unknown>;

  // Проверяем что это RTK Query action (имеет meta.arg.endpointName)
  const meta = act.meta as Record<string, unknown> | undefined;
  const arg = meta?.arg as Record<string, unknown> | undefined;

  return (
    typeof act.type === 'string' &&
    act.type.endsWith('/rejected') &&
    typeof arg?.endpointName === 'string'
  );
}

/**
 * RTK Query middleware для централизованной обработки ошибок
 */
export const errorMiddleware: Middleware = (api) => (next) => (action) => {
  const act = action as { type?: string };

  // DEBUG: логируем все actions для отладки
  if (act.type?.includes('rejected') || act.type?.includes('Rejected')) {
    console.log('[errorMiddleware] Rejected action:', act.type, action);
  }

  // Проверяем оба варианта: isRejectedWithValue (для ошибок от сервера)
  // и наш кастомный чек (для всех rejected RTK Query actions)
  const isRejectedVal = isRejectedWithValue(action);
  const isRTKRejected = isRTKQueryRejectedAction(action);

  console.log('[errorMiddleware] Check:', {
    type: act.type,
    isRejectedWithValue: isRejectedVal,
    isRTKQueryRejected: isRTKRejected,
  });

  if (!isRejectedVal && !isRTKRejected) {
    return next(action);
  }

  console.log('[errorMiddleware] Processing rejected action:', action);

  const typedAction = action as UnknownAction & {
    payload?: unknown;
    error?: { message?: string };
    meta?: { arg?: { endpointName?: string } };
  };

  const endpointName = typedAction.meta?.arg?.endpointName;

  // Проверяем, нужно ли игнорировать этот endpoint
  if (
    endpointName &&
    middlewareConfig.silentEndpoints?.includes(endpointName)
  ) {
    return next(action);
  }

  const { callbacks } = middlewareConfig;

  // payload содержит ошибку для isRejectedWithValue
  // error содержит ошибку для обычных rejected actions
  const error = (typedAction.payload ?? typedAction.error) as RTKError;

  // Обработка сетевых ошибок
  if (isNetworkError(error)) {
    callbacks?.onNetworkError?.();
    showErrorToast(
      api.dispatch,
      'Network error. Please check your connection.',
    );
    return next(action);
  }

  // Получаем структурированную ошибку
  const errorResponse = isFetchBaseQueryError(error)
    ? getErrorResponse(error)
    : null;

  const errorCode = errorResponse?.code;
  const errorMessage =
    errorResponse?.message ||
    (error && 'message' in error
      ? (error as { message: string }).message
      : null) ||
    'An error occurred';

  // Проверяем, нужно ли игнорировать этот код ошибки
  if (errorCode && middlewareConfig.silentErrorCodes?.includes(errorCode)) {
    return next(action);
  }

  // Кастомная обработка по коду ошибки
  if (errorCode && callbacks?.onErrorCode?.(errorCode, errorMessage)) {
    return next(action);
  }

  // Обработка ошибок аутентификации
  if (
    errorCode === ERROR_CODES.UNAUTHORIZED ||
    errorCode === ERROR_CODES.INVALID_CREDENTIALS
  ) {
    callbacks?.onAuthError?.();
    // Не показываем toast для auth ошибок по умолчанию
    return next(action);
  }

  // Для всех остальных ошибок показываем toast
  showErrorToast(api.dispatch, errorMessage);

  return next(action);
};
