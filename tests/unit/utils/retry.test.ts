/**
 * Tests for retry utility functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { retry, retryWithTimeout } from '../../../src/utils/retry';
import { AIIntegratorError } from '../../../src/core/types';

describe('retry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    const result = await retry(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Attempt 1 failed'))
      .mockRejectedValueOnce(new Error('Attempt 2 failed'))
      .mockResolvedValue('success');

    const result = await retry(fn, { maxRetries: 3, initialDelay: 10 });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Always fails'));

    await expect(
      retry(fn, { maxRetries: 2, initialDelay: 10 })
    ).rejects.toThrow('Always fails');

    expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('should not retry non-retryable errors', async () => {
    const error = new AIIntegratorError(
      'authentication_error',
      'Invalid API key',
      401,
      'openai',
      false // Not retryable
    );
    const fn = vi.fn().mockRejectedValue(error);

    await expect(retry(fn, { maxRetries: 3 })).rejects.toThrow('Invalid API key');

    expect(fn).toHaveBeenCalledTimes(1); // Should not retry
  });

  it('should retry retryable errors', async () => {
    const error = new AIIntegratorError(
      'rate_limit_error',
      'Rate limit exceeded',
      429,
      'openai',
      true // Retryable
    );
    const fn = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue('success');

    const result = await retry(fn, { maxRetries: 2, initialDelay: 10 });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should respect custom isRetryable function', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Custom error'));
    const isRetryable = vi.fn().mockReturnValue(false);

    await expect(retry(fn, { maxRetries: 3 }, isRetryable)).rejects.toThrow();

    expect(fn).toHaveBeenCalledTimes(1);
    expect(isRetryable).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should use exponential backoff', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValue('success');

    const startTime = Date.now();
    await retry(fn, {
      maxRetries: 3,
      initialDelay: 100,
      backoffMultiplier: 2,
    });
    const endTime = Date.now();

    // Should take at least 100ms (first retry) + 200ms (second retry) = 300ms
    expect(endTime - startTime).toBeGreaterThanOrEqual(250); // Allow some margin
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should respect maxDelay', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValue('success');

    const startTime = Date.now();
    await retry(fn, {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 50, // Cap at 50ms
      backoffMultiplier: 2,
    });
    const endTime = Date.now();

    // Should be capped at maxDelay, not exceed 200ms total
    expect(endTime - startTime).toBeLessThan(200);
  });
});

describe('retryWithTimeout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should succeed before timeout', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    const result = await retryWithTimeout(fn, 1000);

    expect(result).toBe('success');
  });

  it('should timeout if operation takes too long', async () => {
    const fn = vi.fn().mockImplementation(() => {
      return new Promise((resolve) => setTimeout(() => resolve('late'), 2000));
    });

    await expect(retryWithTimeout(fn, 100)).rejects.toThrow(/timed out/i);
  });

  it('should combine retry and timeout', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockResolvedValue('success');

    const result = await retryWithTimeout(
      fn,
      1000,
      { maxRetries: 2, initialDelay: 10 }
    );

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw timeout error with correct properties', async () => {
    const fn = vi.fn().mockImplementation(() => {
      return new Promise((resolve) => setTimeout(() => resolve('late'), 2000));
    });

    try {
      await retryWithTimeout(fn, 100);
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(AIIntegratorError);
      const aiError = error as AIIntegratorError;
      expect(aiError.type).toBe('timeout_error');
      expect(aiError.retryable).toBe(true);
    }
  });
});
