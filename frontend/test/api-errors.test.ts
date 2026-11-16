import { apiUrl, parseApiError, parseFailedResponse } from '@/lib/api';

const validationBody = {
  success: false,
  error: {
    message: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: [
      { field: 'name', message: 'Name is required' },
      { field: 'description', message: 'Description is required' },
      { field: 'name', message: 'Name must be at least 3 characters' },
    ],
  },
};

describe('parseApiError', () => {
  it('reads the backend error envelope, keeping the first message per field', () => {
    const parsed = parseApiError(validationBody);

    expect(parsed.message).toBe('Validation failed');
    expect(parsed.code).toBe('VALIDATION_ERROR');
    expect(parsed.fieldErrors).toEqual({
      name: 'Name is required',
      description: 'Description is required',
    });
  });

  it('unwraps axios-style errors and keeps the HTTP status', () => {
    const parsed = parseApiError({
      response: { status: 400, data: validationBody },
    });

    expect(parsed.status).toBe(400);
    expect(parsed.message).toBe('Validation failed');
    expect(parsed.fieldErrors.name).toBe('Name is required');
  });

  it('falls back to a caller-supplied message when the body is not an envelope', () => {
    const parsed = parseApiError(new Error('Network Error'), 'Could not post this intent');

    expect(parsed.message).toBe('Could not post this intent');
    expect(parsed.fieldErrors).toEqual({});
    expect(parsed.status).toBeUndefined();
  });

  it('uses a top-level message when there is no error object', () => {
    expect(parseApiError({ message: 'Rate limit exceeded' }).message).toBe('Rate limit exceeded');
  });

  it('ignores malformed details instead of throwing', () => {
    const parsed = parseApiError({
      error: { message: 'Bad request', details: [null, 42, { field: 'name' }] },
    });

    expect(parsed.message).toBe('Bad request');
    expect(parsed.fieldErrors).toEqual({});
  });
});

describe('parseFailedResponse', () => {
  it('reads a JSON error body and takes the status from the response', async () => {
    const response = {
      status: 422,
      json: async () => validationBody,
    } as unknown as Response;

    const parsed = await parseFailedResponse(response, 'Fallback');

    expect(parsed.status).toBe(422);
    expect(parsed.message).toBe('Validation failed');
    expect(parsed.fieldErrors.description).toBe('Description is required');
  });

  it('survives an HTML error page', async () => {
    const response = {
      status: 502,
      json: async () => {
        throw new SyntaxError('Unexpected token <');
      },
    } as unknown as Response;

    const parsed = await parseFailedResponse(response, 'Service unavailable');

    expect(parsed.status).toBe(502);
    expect(parsed.message).toBe('Service unavailable');
  });
});

describe('apiUrl', () => {
  it('targets the same origin by default', () => {
    expect(apiUrl('/agents')).toBe('/api/agents');
    expect(apiUrl('intents')).toBe('/api/intents');
  });
});
