/**
 * Tests for Anthropic provider
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnthropicProvider } from '../../../src/providers/anthropic';
import {
  createMockAnthropicResponse,
  createMockAnthropicStream,
  createMockAnthropicError,
} from '../../mocks/anthropic.mock';
import { AIIntegratorError } from '../../../src/core/types';

// Create mock function
const mockCreate = vi.fn();

// Mock the anthropic module
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(function() {
    return {
      messages: {
        create: mockCreate,
      },
    };
  }),
}));

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new AnthropicProvider({
      provider: 'anthropic',
      apiKey: 'test-api-key',
    });
  });

  describe('initialization', () => {
    it('should initialize with correct type', () => {
      expect(provider.type).toBe('anthropic');
    });

    it('should be configured when api key is provided', () => {
      expect(provider.isConfigured()).toBe(true);
    });

    it('should throw error when API key is not provided', () => {
      expect(() => {
        new AnthropicProvider({
          provider: 'anthropic',
          apiKey: '',
        });
      }).toThrow('API key is required but was not provided');
    });

    it('should throw error when API key is only whitespace', () => {
      expect(() => {
        new AnthropicProvider({
          provider: 'anthropic',
          apiKey: '   ',
        });
      }).toThrow('API key is required but was not provided');
    });

    it('should throw error when API key is undefined', () => {
      expect(() => {
        new AnthropicProvider({
          provider: 'anthropic',
          apiKey: undefined as any,
        });
      }).toThrow('API key is required but was not provided');
    });
  });

  describe('chat', () => {
    it('should successfully complete a chat request', async () => {
      const mockResponse = createMockAnthropicResponse('Hello from Claude!');
      mockCreate.mockResolvedValue(mockResponse);

      const response = await provider.chat({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(response).toMatchObject({
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        message: {
          role: 'assistant',
          content: 'Hello from Claude!',
        },
        finish_reason: 'stop',
      });

      expect(response.usage).toMatchObject({
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      });
    });

    it('should handle system messages correctly', async () => {
      const mockResponse = createMockAnthropicResponse();
      mockCreate.mockResolvedValue(mockResponse);

      await provider.chat({
        model: 'claude-3-5-sonnet-20241022',
        messages: [
          { role: 'system', content: 'You are a helpful assistant' },
          { role: 'user', content: 'Hello' },
        ],
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          system: 'You are a helpful assistant',
          messages: [{ role: 'user', content: 'Hello' }],
        })
      );
    });

    it('should combine multiple system messages', async () => {
      const mockResponse = createMockAnthropicResponse();
      mockCreate.mockResolvedValue(mockResponse);

      await provider.chat({
        model: 'claude-3-5-sonnet-20241022',
        messages: [
          { role: 'system', content: 'First instruction' },
          { role: 'system', content: 'Second instruction' },
          { role: 'user', content: 'Hello' },
        ],
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          system: 'First instruction\n\nSecond instruction',
        })
      );
    });

    it('should use default model if not specified', async () => {
      const mockResponse = createMockAnthropicResponse();
      mockCreate.mockResolvedValue(mockResponse);

      await provider.chat({
        model: '',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-3-5-sonnet-20241022',
        })
      );
    });

    it('should pass parameters correctly', async () => {
      const mockResponse = createMockAnthropicResponse();
      mockCreate.mockResolvedValue(mockResponse);

      await provider.chat({
        model: 'claude-3-opus-20240229',
        messages: [{ role: 'user', content: 'Test' }],
        temperature: 0.8,
        max_tokens: 1000,
        top_p: 0.9,
        stop: ['END', 'STOP'],
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-3-opus-20240229',
          temperature: 0.8,
          max_tokens: 1000,
          top_p: 0.9,
          stop_sequences: ['END', 'STOP'],
          stream: false,
        })
      );
    });

    it('should use default max_tokens if not specified', async () => {
      const mockResponse = createMockAnthropicResponse();
      mockCreate.mockResolvedValue(mockResponse);

      await provider.chat({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: 'Test' }],
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 4096,
        })
      );
    });

    it('should map stop reason correctly', async () => {
      const response = { ...createMockAnthropicResponse(), stop_reason: 'max_tokens' };
      mockCreate.mockResolvedValue(response);

      const result = await provider.chat({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: 'Test' }],
      });

      expect(result.finish_reason).toBe('length');
    });

    it('should handle API errors correctly', async () => {
      const error = createMockAnthropicError(401, 'Invalid API key');
      mockCreate.mockRejectedValue(error);

      try {
        await provider.chat({
          model: 'claude-3-5-sonnet-20241022',
          messages: [{ role: 'user', content: 'Test' }],
        });
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(AIIntegratorError);
        const aiError = e as AIIntegratorError;
        expect(aiError.type).toBe('authentication_error');
        expect(aiError.provider).toBe('anthropic');
      }
    });
  });

  describe('chatStream', () => {
    it('should successfully stream responses', async () => {
      const mockStream = createMockAnthropicStream('Hello streaming Claude');
      mockCreate.mockResolvedValue(mockStream);

      const chunks: string[] = [];
      const stream = provider.chatStream({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: 'Stream test' }],
      });

      for await (const chunk of stream) {
        if (chunk.delta.content) {
          chunks.push(chunk.delta.content);
        }
      }

      expect(chunks.join('')).toBe('Hello streaming Claude');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          stream: true,
        })
      );
    });

    it('should yield finish_reason on message_stop', async () => {
      const mockStream = createMockAnthropicStream('Test');
      mockCreate.mockResolvedValue(mockStream);

      let hasFinishReason = false;
      const stream = provider.chatStream({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: 'Test' }],
      });

      for await (const chunk of stream) {
        if (chunk.finish_reason === 'stop') {
          hasFinishReason = true;
        }
      }

      expect(hasFinishReason).toBe(true);
    });

    it('should handle system messages in streaming', async () => {
      const mockStream = createMockAnthropicStream('Response');
      mockCreate.mockResolvedValue(mockStream);

      const stream = provider.chatStream({
        model: 'claude-3-5-sonnet-20241022',
        messages: [
          { role: 'system', content: 'System prompt' },
          { role: 'user', content: 'Test' },
        ],
      });

      for await (const chunk of stream) {
        // Just consume the stream
      }

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          system: 'System prompt',
          stream: true,
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle rate limit errors', async () => {
      const error = createMockAnthropicError(429, 'Rate limit exceeded');
      mockCreate.mockRejectedValue(error);

      try {
        await provider.chat({
          model: 'claude-3-5-sonnet-20241022',
          messages: [{ role: 'user', content: 'Test' }],
        });
      } catch (e) {
        const aiError = e as AIIntegratorError;
        expect(aiError.type).toBe('rate_limit_error');
        expect(aiError.retryable).toBe(true);
      }
    });

    it('should handle invalid request errors', async () => {
      const error = createMockAnthropicError(400, 'Invalid request');
      mockCreate.mockRejectedValue(error);

      try {
        await provider.chat({
          model: 'claude-3-5-sonnet-20241022',
          messages: [{ role: 'user', content: 'Test' }],
        });
      } catch (e) {
        const aiError = e as AIIntegratorError;
        expect(aiError.type).toBe('invalid_request_error');
        expect(aiError.retryable).toBe(false);
      }
    });

    it('should handle server errors as retryable', async () => {
      const error = createMockAnthropicError(503, 'Service unavailable');
      mockCreate.mockRejectedValue(error);

      try {
        await provider.chat({
          model: 'claude-3-5-sonnet-20241022',
          messages: [{ role: 'user', content: 'Test' }],
        });
      } catch (e) {
        const aiError = e as AIIntegratorError;
        expect(aiError.type).toBe('api_error');
        expect(aiError.retryable).toBe(true);
      }
    });

    it('should handle ECONNABORTED errors as timeout', async () => {
      const error: any = new Error('Connection aborted');
      error.code = 'ECONNABORTED';
      mockCreate.mockRejectedValue(error);

      try {
        await provider.chat({
          model: 'claude-3-5-sonnet-20241022',
          messages: [{ role: 'user', content: 'Test' }],
        });
      } catch (e) {
        const aiError = e as AIIntegratorError;
        expect(aiError.type).toBe('timeout_error');
        expect(aiError.retryable).toBe(true);
      }
    });

    it('should handle ETIMEDOUT errors as timeout', async () => {
      const error: any = new Error('Timeout');
      error.code = 'ETIMEDOUT';
      mockCreate.mockRejectedValue(error);

      try {
        await provider.chat({
          model: 'claude-3-5-sonnet-20241022',
          messages: [{ role: 'user', content: 'Test' }],
        });
      } catch (e) {
        const aiError = e as AIIntegratorError;
        expect(aiError.type).toBe('timeout_error');
        expect(aiError.retryable).toBe(true);
      }
    });

    it('should handle ENOTFOUND errors as network error', async () => {
      const error: any = new Error('Not found');
      error.code = 'ENOTFOUND';
      mockCreate.mockRejectedValue(error);

      try {
        await provider.chat({
          model: 'claude-3-5-sonnet-20241022',
          messages: [{ role: 'user', content: 'Test' }],
        });
      } catch (e) {
        const aiError = e as AIIntegratorError;
        expect(aiError.type).toBe('network_error');
        expect(aiError.retryable).toBe(true);
      }
    });

    it('should handle ECONNREFUSED errors as network error', async () => {
      const error: any = new Error('Connection refused');
      error.code = 'ECONNREFUSED';
      mockCreate.mockRejectedValue(error);

      try {
        await provider.chat({
          model: 'claude-3-5-sonnet-20241022',
          messages: [{ role: 'user', content: 'Test' }],
        });
      } catch (e) {
        const aiError = e as AIIntegratorError;
        expect(aiError.type).toBe('network_error');
        expect(aiError.retryable).toBe(true);
      }
    });
  });

  describe('validation', () => {
    it('should throw error for max_tokens less than 1', async () => {
      await expect(
        provider.chat({
          model: 'claude-3-5-sonnet-20241022',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 0,
        })
      ).rejects.toThrow(/max_tokens must be greater than 0/);
    });
  });

  describe('deprecation warnings', () => {
    let consoleWarnSpy: any;

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it('should warn about deprecated functions parameter when debug is enabled', async () => {
      const debugProvider = new AnthropicProvider({
        provider: 'anthropic',
        apiKey: 'test-api-key',
        debug: true,
      });

      const mockResponse = createMockAnthropicResponse();
      mockCreate.mockResolvedValue(mockResponse);

      await debugProvider.chat({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: 'Test' }],
        functions: [{ name: 'test', description: 'test', parameters: {} }] as any,
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEPRECATION WARNING')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('functions')
      );
    });

    it('should warn about deprecated function_call parameter when debug is enabled', async () => {
      const debugProvider = new AnthropicProvider({
        provider: 'anthropic',
        apiKey: 'test-api-key',
        debug: true,
      });

      const mockResponse = createMockAnthropicResponse();
      mockCreate.mockResolvedValue(mockResponse);

      await debugProvider.chat({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: 'Test' }],
        function_call: 'auto' as any,
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEPRECATION WARNING')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('function_call')
      );
    });

    it('should not warn when debug is disabled', async () => {
      const mockResponse = createMockAnthropicResponse();
      mockCreate.mockResolvedValue(mockResponse);

      await provider.chat({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: 'Test' }],
        functions: [{ name: 'test', description: 'test', parameters: {} }] as any,
      });

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('finish reason mapping', () => {
    it('should return null for unknown finish reasons', async () => {
      const response = { ...createMockAnthropicResponse(), stop_reason: 'unknown_reason' as any };
      mockCreate.mockResolvedValue(response);

      const result = await provider.chat({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: 'Test' }],
      });

      expect(result.finish_reason).toBe(null);
    });
  });
});
