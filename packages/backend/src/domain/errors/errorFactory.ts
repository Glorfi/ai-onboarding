import {
  ERROR_CODES,
  ERROR_STATUS_CODES,
  type ErrorCode,
} from '@ai-onboarding/shared';

export class BusinessError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly statusCode: number = ERROR_STATUS_CODES[code]
  ) {
    super(message);
    this.name = 'BusinessError';
    Object.setPrototypeOf(this, BusinessError.prototype);
  }

  toResponse() {
    return {
      message: this.message,
      code: this.code,
    };
  }
}

export const Errors = {
  validation: (message: string) =>
    new BusinessError(message, ERROR_CODES.VALIDATION_ERROR),

  unauthorized: (message: string = 'Unauthorized') =>
    new BusinessError(message, ERROR_CODES.UNAUTHORIZED),

  invalidCredentials: () =>
    new BusinessError('Invalid email or password', ERROR_CODES.INVALID_CREDENTIALS),

  forbidden: (message: string = 'Forbidden') =>
    new BusinessError(message, ERROR_CODES.FORBIDDEN),

  notFound: (entity: string) =>
    new BusinessError(`${entity} not found`, ERROR_CODES.NOT_FOUND),

  emailAlreadyExists: () =>
    new BusinessError(
      'User with this email already exists',
      ERROR_CODES.EMAIL_EXISTS
    ),

  conflict: (message: string) =>
    new BusinessError(message, ERROR_CODES.CONFLICT),

  invalidOperation: (message: string) =>
    new BusinessError(message, ERROR_CODES.INVALID_OPERATION),

  limitExceeded: (message: string) =>
    new BusinessError(message, ERROR_CODES.LIMIT_EXCEEDED),

  rateLimitExceeded: (message: string = 'Rate limit exceeded') =>
    new BusinessError(message, ERROR_CODES.RATE_LIMIT_EXCEEDED),

  internal: (message: string = 'Internal server error') =>
    new BusinessError(message, ERROR_CODES.INTERNAL_ERROR),

  oauthProviderNotSupported: (provider: string) =>
    new BusinessError(
      `OAuth provider '${provider}' is not supported`,
      ERROR_CODES.OAUTH_PROVIDER_NOT_SUPPORTED
    ),

  oauthAccountAlreadyLinked: () =>
    new BusinessError(
      'This OAuth account is already linked to another user',
      ERROR_CODES.OAUTH_ALREADY_LINKED
    ),

  oauthAccountNotFound: () =>
    new BusinessError('OAuth account not found', ERROR_CODES.OAUTH_NOT_FOUND),

  cannotUnlinkLastAuth: () =>
    new BusinessError(
      'Cannot unlink the last authentication method. Add password or another OAuth provider first.',
      ERROR_CODES.CANNOT_UNLINK_LAST_AUTH
    ),

  oauthStateInvalid: () =>
    new BusinessError(
      'Invalid or expired OAuth state',
      ERROR_CODES.OAUTH_STATE_INVALID
    ),

  oauthCallbackError: (message: string) =>
    new BusinessError(
      `OAuth callback error: ${message}`,
      ERROR_CODES.OAUTH_CALLBACK_ERROR
    ),
};
