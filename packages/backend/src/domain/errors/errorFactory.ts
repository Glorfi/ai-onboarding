export class BusinessError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'BusinessError';
  }
}

export const Errors = {
  validation: (message: string) =>
    new BusinessError(message, 'VALIDATION_ERROR', 400),

  unauthorized: (message: string = 'Unauthorized') =>
    new BusinessError(message, 'UNAUTHORIZED', 401),

  invalidCredentials: () =>
    new BusinessError('Invalid email or password', 'INVALID_CREDENTIALS', 401),

  forbidden: (message: string = 'Forbidden') =>
    new BusinessError(message, 'FORBIDDEN', 403),

  notFound: (entity: string) =>
    new BusinessError(`${entity} not found`, 'NOT_FOUND', 404),

  emailAlreadyExists: () =>
    new BusinessError('User with this email already exists', 'EMAIL_EXISTS', 409),

  conflict: (message: string) =>
    new BusinessError(message, 'CONFLICT', 409),

  invalidOperation: (message: string) =>
    new BusinessError(message, 'INVALID_OPERATION', 422),

  limitExceeded: (message: string) =>
    new BusinessError(message, 'LIMIT_EXCEEDED', 429),

  internal: (message: string = 'Internal server error') =>
    new BusinessError(message, 'INTERNAL_ERROR', 500),

  oauthProviderNotSupported: (provider: string) =>
    new BusinessError(
      `OAuth provider '${provider}' is not supported`,
      'OAUTH_PROVIDER_NOT_SUPPORTED',
      400
    ),

  oauthAccountAlreadyLinked: () =>
    new BusinessError(
      'This OAuth account is already linked to another user',
      'OAUTH_ALREADY_LINKED',
      409
    ),

  oauthAccountNotFound: () =>
    new BusinessError('OAuth account not found', 'OAUTH_NOT_FOUND', 404),

  cannotUnlinkLastAuth: () =>
    new BusinessError(
      'Cannot unlink the last authentication method. Add password or another OAuth provider first.',
      'CANNOT_UNLINK_LAST_AUTH',
      400
    ),

  oauthStateInvalid: () =>
    new BusinessError('Invalid or expired OAuth state', 'OAUTH_STATE_INVALID', 400),

  oauthCallbackError: (message: string) =>
    new BusinessError(`OAuth callback error: ${message}`, 'OAUTH_CALLBACK_ERROR', 400),
};
