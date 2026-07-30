/**
 * Thin fetch client for the BIGB backend API.
 */

import { APP_CONFIG } from '@/shared/constants/config';
import { ApiError, type ApiSuccess } from '@/shared/api/types';

const API_BASE_URL = APP_CONFIG.apiBaseUrl.replace(/\/$/, '');

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  formData?: FormData;
  token?: string | null;
  signal?: AbortSignal;
};

/**
 * Performs a JSON or multipart request against the versioned API.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers();

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  let body: BodyInit_ | undefined;

  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.body);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    APP_CONFIG.apiTimeoutMs,
  );
  const signal = options.signal ?? controller.signal;

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method || 'GET',
      headers,
      body,
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', {
        status: 0,
        code: 'TIMEOUT',
      });
    }

    throw new ApiError(
      'Cannot reach the API. Check your network and API_BASE_URL.',
      { status: 0, code: 'NETWORK_ERROR' },
    );
  } finally {
    clearTimeout(timeoutId);
  }

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const failure = payload as {
      message?: string;
      code?: string;
      details?: unknown;
    } | null;

    throw new ApiError(
      failure?.message || `Request failed (${response.status})`,
      {
        status: response.status,
        code: failure?.code,
        details: failure?.details,
      },
    );
  }

  const success = payload as ApiSuccess<T> | null;

  if (!success || success.success !== true) {
    throw new ApiError('Unexpected API response', {
      status: response.status,
      code: 'UNEXPECTED_RESPONSE',
    });
  }

  return success.data;
}

export { API_BASE_URL };
