import type { RetryConfig } from '../core/types';
import { AIIntegratorError, ErrorType } from '../core/types';

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 60000,
  backoffMultiplier: 2,
};

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay for next retry with exponential backoff
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelay);
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  isRetryable: (error: unknown) => boolean = () => true
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      const shouldRetry = error instanceof AIIntegratorError
        ? error.retryable
        : isRetryable(error);

      // Don't retry if not retryable or max retries reached
      if (!shouldRetry || attempt >= retryConfig.maxRetries) {
        throw error;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, retryConfig);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Retry with timeout
 */
export async function retryWithTimeout<T>(
  fn: () => Promise<T>,
  timeout: number,
  retryConfig: Partial<RetryConfig> = {}
): Promise<T> {
  return Promise.race([
    retry(fn, retryConfig),
    new Promise<T>((_, reject) =>
      setTimeout(() => {
        reject(
          new AIIntegratorError(
            ErrorType.TIMEOUT,
            `Operation timed out after ${timeout}ms`,
            undefined,
            undefined,
            true
          )
        );
      }, timeout)
    ),
  ]);
}
