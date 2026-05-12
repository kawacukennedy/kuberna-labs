export class KubernaError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string = 'KUBERNA_ERROR', statusCode: number = 500) {
    super(message);
    this.name = 'KubernaError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class AuthenticationError extends KubernaError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends KubernaError {
  constructor(message: string = 'Validation failed') {
    super(message, 'VALIDATION_ERROR', 422);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends KubernaError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ConfigurationError extends KubernaError {
  constructor(message: string = 'Invalid SDK configuration') {
    super(message, 'CONFIGURATION_ERROR', 500);
    this.name = 'ConfigurationError';
  }
}

export class NetworkError extends KubernaError {
  constructor(message: string = 'Network request failed') {
    super(message, 'NETWORK_ERROR', 503);
    this.name = 'NetworkError';
  }
}
