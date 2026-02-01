import type { ErrorCode } from './errorCodes';

/**
 * Ошибка валидации отдельного поля
 */
export interface IFieldError {
  /** Путь к полю (например: "email", "address.city", "items.0.name") */
  field: string;
  /** Человекочитаемое сообщение об ошибке */
  message: string;
  /** Код валидационной ошибки (опционально, для программной обработки) */
  code?: string;
}

/**
 * Базовый интерфейс ответа об ошибке
 */
export interface IErrorResponseBase {
  /** Человекочитаемое сообщение об ошибке */
  message: string;
  /** Машиночитаемый код ошибки */
  code: ErrorCode;
}

/**
 * Ответ с ошибкой валидации (содержит детали по полям)
 */
export interface IValidationErrorResponse extends IErrorResponseBase {
  code: 'VALIDATION_ERROR';
  /** Детализированные ошибки по полям */
  errors: IFieldError[];
}

/**
 * Ответ с бизнес-ошибкой (без детализации по полям)
 */
export interface IBusinessErrorResponse extends IErrorResponseBase {
  code: Exclude<ErrorCode, 'VALIDATION_ERROR'>;
}

/**
 * Объединенный тип ответа об ошибке
 */
export type IErrorResponse = IValidationErrorResponse | IBusinessErrorResponse;

/**
 * Type guard для проверки, является ли ошибка ошибкой валидации
 */
export function isValidationErrorResponse(
  error: IErrorResponse
): error is IValidationErrorResponse {
  return error.code === 'VALIDATION_ERROR' && 'errors' in error;
}

/**
 * HTTP статус коды для ошибок
 */
export const ERROR_STATUS_CODES: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  INVALID_CREDENTIALS: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  EMAIL_EXISTS: 409,
  CONFLICT: 409,
  OAUTH_ALREADY_LINKED: 409,
  INVALID_OPERATION: 422,
  LIMIT_EXCEEDED: 429,
  RATE_LIMIT_EXCEEDED: 429,
  INTERNAL_ERROR: 500,
  OAUTH_PROVIDER_NOT_SUPPORTED: 400,
  OAUTH_NOT_FOUND: 404,
  CANNOT_UNLINK_LAST_AUTH: 400,
  OAUTH_STATE_INVALID: 400,
  OAUTH_CALLBACK_ERROR: 400,
  // Site errors
  SITE_NOT_FOUND: 404,
  SITE_NOT_OWNED: 403,
  // Crawl errors
  CRAWL_INVALID_URL: 400,
  CRAWL_BOT_DETECTED: 403,
  CRAWL_NO_CONTENT: 400,
  CRAWL_INSUFFICIENT_PAGES: 400,
  CRAWL_ALREADY_IN_PROGRESS: 409,
  CRAWL_RATE_LIMITED: 429,
  // Widget errors
  WIDGET_API_KEY_INVALID: 401,
  WIDGET_API_KEY_INACTIVE: 401,
  WIDGET_DOMAIN_MISMATCH: 403,
  WIDGET_SESSION_LIMIT: 429,
  WIDGET_IP_LIMIT: 429,
  WIDGET_MESSAGE_NOT_FOUND: 404,
  WIDGET_QUESTION_NOT_FOUND: 404,
};
