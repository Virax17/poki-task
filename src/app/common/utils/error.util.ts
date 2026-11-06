import { HttpErrorResponse } from '@angular/common/http';

/** Error carrying a message that is safe to show to end users. */
export class ApiError extends Error {
  constructor(
    message: string,
    override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Converts any thrown value into a user-friendly {@link ApiError}.
 * Raw HTTP / GraphQL details are never exposed to the UI.
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return new ApiError(
        'Cannot reach the server. Check your connection and try again.',
        error,
      );
    }
    if (error.status >= 500) {
      return new ApiError('The server had a problem. Please try again.', error);
    }
    return new ApiError('The request failed. Please try again.', error);
  }

  return new ApiError('Something went wrong. Please try again.', error);
}

/** Returns a user-friendly message for any thrown value. */
export function toErrorMessage(error: unknown): string {
  return toApiError(error).message;
}
