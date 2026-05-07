export class NotFoundError extends Error {
  public readonly code = 'NOT_FOUND';

  constructor(message: string) {
    super(message);
  }
}

export class ValidationError extends Error {
  public readonly code = 'VALIDATION_ERROR';

  constructor(message: string) {
    super(message);
  }
}

export class DependencyUnavailableError extends Error {
  public readonly code = 'DEPENDENCY_UNAVAILABLE';

  constructor(message: string) {
    super(message);
  }
}

export type ApplicationError = NotFoundError | ValidationError | DependencyUnavailableError;

export function isApplicationError(error: unknown): error is ApplicationError {
  return (
    error instanceof NotFoundError ||
    error instanceof ValidationError ||
    error instanceof DependencyUnavailableError
  );
}
