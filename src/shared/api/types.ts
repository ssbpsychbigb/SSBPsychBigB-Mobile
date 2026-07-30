/**
 * Shared API types matching the backend response envelope.
 */

export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
  meta?: unknown;
};

export type ApiFailure = {
  success: false;
  message: string;
  code?: string;
  details?: unknown;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(
    message: string,
    options: { status: number; code?: string; details?: unknown },
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}
