/**
 * Tests for core types and error handling
 */

import { describe, it, expect } from 'vitest';
import { AIIntegratorError, ErrorType } from '../../../src/core/types';

describe('AIIntegratorError', () => {
  it('should create error with correct properties', () => {
    const error = new AIIntegratorError(
      ErrorType.RATE_LIMIT,
      'Rate limit exceeded',
      429,
      'openai',
      true
    );

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AIIntegratorError);
    expect(error.type).toBe(ErrorType.RATE_LIMIT);
    expect(error.message).toBe('Rate limit exceeded');
    expect(error.statusCode).toBe(429);
    expect(error.provider).toBe('openai');
    expect(error.retryable).toBe(true);
  });

  it('should create authentication error', () => {
    const error = new AIIntegratorError(
      ErrorType.AUTHENTICATION,
      'Invalid API key',
      401,
      'anthropic',
      false
    );

    expect(error.type).toBe(ErrorType.AUTHENTICATION);
    expect(error.retryable).toBe(false);
  });

  it('should create timeout error', () => {
    const error = new AIIntegratorError(
      ErrorType.TIMEOUT,
      'Request timed out',
      undefined,
      undefined,
      true
    );

    expect(error.type).toBe(ErrorType.TIMEOUT);
    expect(error.retryable).toBe(true);
  });

  it('should have correct error name', () => {
    const error = new AIIntegratorError(
      ErrorType.API_ERROR,
      'API error',
      500,
      'gemini',
      true
    );

    expect(error.name).toBe('AIIntegratorError');
  });

  it('should store original error', () => {
    const originalError = new Error('Original');
    const error = new AIIntegratorError(
      ErrorType.UNKNOWN,
      'Wrapped error',
      undefined,
      undefined,
      false,
      originalError
    );

    expect(error.originalError).toBe(originalError);
  });
});

describe('ErrorType enum', () => {
  it('should have all error types defined', () => {
    expect(ErrorType.AUTHENTICATION).toBe('authentication_error');
    expect(ErrorType.RATE_LIMIT).toBe('rate_limit_error');
    expect(ErrorType.INVALID_REQUEST).toBe('invalid_request_error');
    expect(ErrorType.API_ERROR).toBe('api_error');
    expect(ErrorType.TIMEOUT).toBe('timeout_error');
    expect(ErrorType.NETWORK).toBe('network_error');
    expect(ErrorType.UNKNOWN).toBe('unknown_error');
  });
});
