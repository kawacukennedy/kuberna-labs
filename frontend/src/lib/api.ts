const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export function apiUrl(path: string): string {
  const base = API_BASE.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return `${base}/api${cleanPath}`;
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ParsedApiError {
  /** Human-readable summary, safe to render next to a submit button. */
  message: string;
  /** Per-field messages keyed by request body field name. */
  fieldErrors: Record<string, string>;
  /** HTTP status when one is known. */
  status?: number;
  code?: string;
}

interface ErrorEnvelope {
  error?: {
    message?: string;
    code?: string;
    details?: unknown;
  };
  message?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * JSON error bodies are plain objects. Anything else — an Error instance, a
 * Response, a string — has no envelope to read, and its `.message` ("Failed to
 * fetch", "Network Error") is not something to show a user.
 */
function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function fieldErrorsFrom(details: unknown): Record<string, string> {
  if (!Array.isArray(details)) return {};

  const fieldErrors: Record<string, string> = {};
  for (const entry of details) {
    if (!isRecord(entry)) continue;
    const field = typeof entry.field === 'string' ? entry.field : undefined;
    const message = typeof entry.message === 'string' ? entry.message : undefined;
    // Keep the first message per field: repeating a field error is noise.
    if (field && message && !fieldErrors[field]) {
      fieldErrors[field] = message;
    }
  }
  return fieldErrors;
}

/**
 * Turns whatever an API call rejected with into a message plus field errors.
 * Handles the backend's `{ success: false, error: { message, code, details } }`
 * envelope, a raw fetch Response body, and axios-style errors
 * (`error.response.data`).
 */
export function parseApiError(input: unknown, fallback = 'Something went wrong. Please try again.'): ParsedApiError {
  let status: number | undefined;
  let payload: unknown = input;

  if (isRecord(input)) {
    const response = input.response;
    if (isRecord(response)) {
      if (typeof response.status === 'number') status = response.status;
      if (response.data !== undefined) payload = response.data;
    } else if (typeof input.status === 'number' && 'data' in input) {
      status = input.status;
      payload = input.data;
    }
  }

  if (!isPlainRecord(payload)) {
    return { message: fallback, fieldErrors: {}, status };
  }

  const envelope = payload as ErrorEnvelope;
  const message =
    (typeof envelope.error?.message === 'string' && envelope.error.message) ||
    (typeof envelope.message === 'string' && envelope.message) ||
    fallback;

  const fieldErrors = fieldErrorsFrom(envelope.error?.details);

  return {
    message,
    fieldErrors,
    status,
    code: typeof envelope.error?.code === 'string' ? envelope.error.code : undefined,
  };
}

/**
 * Reads the JSON body of a failed fetch response without throwing when the
 * server answered with HTML (a proxy error page, for example).
 */
export async function parseFailedResponse(response: Response, fallback?: string): Promise<ParsedApiError> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const parsed = parseApiError(payload, fallback);
  return { ...parsed, status: response.status };
}

export default apiUrl;
