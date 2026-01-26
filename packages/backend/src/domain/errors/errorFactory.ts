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
};
