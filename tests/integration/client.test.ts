/**
 * Integration tests for AIClient
 * Tests the full flow including fallback logic and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIClient } from '../../src/core/client';
import { AIIntegratorError } from '../../src/core/types';
import {
  createMockOpenAIResponse,
  createMockOpenAIStream,
  createMockOpenAIError,
} from '../mocks/openai.mock';
import {
  createMockAnthropicResponse,
  createMockAnthropicStream,
  createMockAnthropicError,
} from '../mocks/anthropic.mock';
import {
  createMockGeminiResponse,
  createMockGeminiStreamResult,
} from '../mocks/gemini.mock';

// Create mock functions
const mockOpenAICreate = vi.fn();
const mockAnthropicCreate = vi.fn();
const mockGeminiSendMessage = vi.fn();
const mockGeminiSendMessageStream = vi.fn();

// Mock all provider SDKs
vi.mock('openai', () => ({
  default: vi.fn(function() {
    return {
      chat: {
        completions: {
          create: mockOpenAICreate,
        },
      },
    };
  }),
}));

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(function() {
    return {
      messages: {
        create: mockAnthropicCreate,
      },
    };
  }),
}));

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(function() {
    return {
      getGenerativeModel: vi.fn(function() {
        return {
          startChat: vi.fn(function() {
            return {
              sendMessage: mockGeminiSendMessage,
              sendMessageStream: mockGeminiSendMessageStream,
            };
          }),
        };
      }),
    };
  }),
}));

describe('AIClient Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('single provider', () => {
    it('should successfully complete a chat request with OpenAI', async () => {
      const client = new AIClient({
        provider: 'openai',
        apiKey: 'test-key',
      });

      mockOpenAICreate.mockResolvedValue(createMockOpenAIResponse('Success!'));

      const response = await client.chat({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Test' }],
      });

      expect(response.message.content).toBe('Success!');
      expect(response.provider).toBe('openai');
    });

    it('should successfully stream with Anthropic', async () => {
      const client = new AIClient({
        provider: 'anthropic',
        apiKey: 'test-key',
      });

      mockAnthropicCreate.mockResolvedValue(createMockAnthropicStream('Streaming works'));

      const chunks: string[] = [];
      const stream = client.chatStream({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: 'Stream test' }],
      });

      for await (const chunk of stream) {
        if (chunk.delta.content) {
          chunks.push(chunk.delta.content);
        }
      }

      expect(chunks.join('')).toBe('Streaming works');
    });

    it('should throw error when provider fails and no fallback', async () => {
      const client = new AIClient({
        provider: 'openai',
        apiKey: 'test-key',
      });

      mockOpenAICreate.mockRejectedValue(createMockOpenAIError(500, 'Server error'));

      await expect(
        client.chat({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow();
    });
  });

  describe('fallback logic', () => {
    it('should fallback to second provider when first fails', async () => {
      const client = new AIClient({
        provider: 'openai',
        apiKey: 'openai-key',
        fallbacks: [
          {
            provider: 'anthropic',
            apiKey: 'anthropic-key',
            priority: 1,
          },
        ],
      });

      // OpenAI fails
      mockOpenAICreate.mockRejectedValue(createMockOpenAIError(503, 'Service unavailable'));

      // Anthropic succeeds
      mockAnthropicCreate.mockResolvedValue(
        createMockAnthropicResponse('Fallback successful!')
      );

      const response = await client.chat({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Test' }],
      });

      expect(response.message.content).toBe('Fallback successful!');
      expect(response.provider).toBe('anthropic');
      expect(mockOpenAICreate).toHaveBeenCalled();
      expect(mockAnthropicCreate).toHaveBeenCalled();
    });

    it('should try all providers in order', async () => {
      const client = new AIClient({
        provider: 'openai',
        apiKey: 'openai-key',
        retry: { maxRetries: 0 }, // Disable retries for faster test
        fallbacks: [
          {
            provider: 'anthropic',
            apiKey: 'anthropic-key',
            priority: 1,
          },
          {
            provider: 'gemini',
            apiKey: 'gemini-key',
            priority: 2,
          },
        ],
      });

      // First two fail
      mockOpenAICreate.mockRejectedValue(createMockOpenAIError(500, 'Error'));
      mockAnthropicCreate.mockRejectedValue(createMockAnthropicError(500, 'Error'));

      // Third succeeds
      mockGeminiSendMessage.mockResolvedValue(createMockGeminiResponse('Gemini works!'));

      const response = await client.chat({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Test' }],
      });

      expect(response.message.content).toBe('Gemini works!');
      expect(response.provider).toBe('gemini');
      expect(mockOpenAICreate).toHaveBeenCalled();
      expect(mockAnthropicCreate).toHaveBeenCalled();
      expect(mockGeminiSendMessage).toHaveBeenCalled();
    });

    it('should throw if all providers fail', async () => {
      const client = new AIClient({
        provider: 'openai',
        apiKey: 'openai-key',
        retry: { maxRetries: 0 }, // Disable retries for faster test
        fallbacks: [
          {
            provider: 'anthropic',
            apiKey: 'anthropic-key',
            priority: 1,
          },
        ],
      });

      mockOpenAICreate.mockRejectedValue(createMockOpenAIError(500, 'OpenAI error'));
      mockAnthropicCreate.mockRejectedValue(createMockAnthropicError(500, 'Anthropic error'));

      await expect(
        client.chat({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow();
    });

    it('should not retry on non-retryable errors without fallback', async () => {
      const client = new AIClient({
        provider: 'openai',
        apiKey: 'test-key',
        retry: { maxRetries: 3 },
      });

      mockOpenAICreate.mockRejectedValue(createMockOpenAIError(401, 'Invalid API key'));

      await expect(
        client.chat({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow(/Invalid API key/);

      // Should only be called once (no retries for auth errors)
      expect(mockOpenAICreate).toHaveBeenCalledTimes(1);
    });

    it('should use fallback for non-retryable errors when available', async () => {
      const client = new AIClient({
        provider: 'openai',
        apiKey: 'bad-key',
        fallbacks: [
          {
            provider: 'anthropic',
            apiKey: 'good-key',
            priority: 1,
          },
        ],
      });

      mockOpenAICreate.mockRejectedValue(createMockOpenAIError(401, 'Invalid API key'));
      mockAnthropicCreate.mockResolvedValue(createMockAnthropicResponse('Success with fallback'));

      const response = await client.chat({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Test' }],
      });

      expect(response.provider).toBe('anthropic');
      expect(response.message.content).toBe('Success with fallback');
    });
  });

  describe('streaming with fallback', () => {
    it('should fallback during streaming if provider fails', async () => {
      const client = new AIClient({
        provider: 'openai',
        apiKey: 'openai-key',
        fallbacks: [
          {
            provider: 'anthropic',
            apiKey: 'anthropic-key',
            priority: 1,
          },
        ],
      });

      mockOpenAICreate.mockRejectedValue(createMockOpenAIError(503, 'Service unavailable'));
      mockAnthropicCreate.mockResolvedValue(
        createMockAnthropicStream('Fallback stream works')
      );

      const chunks: string[] = [];
      const stream = client.chatStream({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Stream test' }],
      });

      for await (const chunk of stream) {
        if (chunk.delta.content) {
          chunks.push(chunk.delta.content);
        }
      }

      expect(chunks.join('')).toBe('Fallback stream works');
      expect(mockOpenAICreate).toHaveBeenCalled();
      expect(mockAnthropicCreate).toHaveBeenCalled();
    });
  });

  describe('retry logic', () => {
    it('should retry on retryable errors', async () => {
      const client = new AIClient({
        provider: 'openai',
        apiKey: 'test-key',
        retry: {
          maxRetries: 2,
          initialDelay: 10,
        },
      });

      // Fail twice, then succeed
      mockOpenAICreate
        .mockRejectedValueOnce(createMockOpenAIError(429, 'Rate limit'))
        .mockRejectedValueOnce(createMockOpenAIError(503, 'Service unavailable'))
        .mockResolvedValue(createMockOpenAIResponse('Success after retries'));

      const response = await client.chat({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Test' }],
      });

      expect(response.message.content).toBe('Success after retries');
      expect(mockOpenAICreate).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should respect timeout setting', async () => {
      const client = new AIClient({
        provider: 'openai',
        apiKey: 'test-key',
        timeout: 100, // Very short timeout
      });

      // Simulate slow response
      mockOpenAICreate.mockImplementation(() => {
        return new Promise((resolve) =>
          setTimeout(() => resolve(createMockOpenAIResponse('Too late')), 500)
        );
      });

      await expect(
        client.chat({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow(/timed out/);
    });
  });

  describe('client info methods', () => {
    it('should return primary provider', () => {
      const client = new AIClient({
        provider: 'openai',
        apiKey: 'test-key',
      });

      expect(client.getPrimaryProvider()).toBe('openai');
    });

    it('should return all providers including fallbacks', () => {
      const client = new AIClient({
        provider: 'openai',
        apiKey: 'test-key',
        fallbacks: [
          { provider: 'anthropic', apiKey: 'key1', priority: 1 },
          { provider: 'gemini', apiKey: 'key2', priority: 2 },
        ],
      });

      const providers = client.getProviders();
      expect(providers).toEqual(['openai', 'anthropic', 'gemini']);
    });

    it('should check if provider is configured', () => {
      const client = new AIClient({
        provider: 'openai',
        apiKey: 'test-key',
        fallbacks: [
          { provider: 'anthropic', apiKey: 'key1', priority: 1 },
        ],
      });

      expect(client.hasProvider('openai')).toBe(true);
      expect(client.hasProvider('anthropic')).toBe(true);
      expect(client.hasProvider('gemini')).toBe(false);
    });
  });

  describe('debug mode', () => {
    it('should enable debug logging', async () => {
      const client = new AIClient({
        provider: 'openai',
        apiKey: 'test-key',
        debug: true,
      });

      mockOpenAICreate.mockResolvedValue(createMockOpenAIResponse('Test'));

      // Debug mode should log
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      await client.chat({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Test' }],
      });

      // Debug logs should be enabled
      expect(infoSpy).toHaveBeenCalled();
    });

    it('should allow toggling debug mode', async () => {
      const client = new AIClient({
        provider: 'openai',
        apiKey: 'test-key',
        debug: false,
      });

      client.setDebug(true);

      mockOpenAICreate.mockResolvedValue(createMockOpenAIResponse('Test'));

      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      await client.chat({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Test' }],
      });

      expect(infoSpy).toHaveBeenCalled();
    });
  });

  describe('error types', () => {
    it('should properly identify authentication errors', async () => {
      const client = new AIClient({
        provider: 'openai',
        apiKey: 'invalid-key',
      });

      mockOpenAICreate.mockRejectedValue(createMockOpenAIError(401, 'Invalid API key'));

      try {
        await client.chat({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AIIntegratorError);
        const aiError = error as AIIntegratorError;
        expect(aiError.type).toBe('authentication_error');
        expect(aiError.retryable).toBe(false);
      }
    });

    it('should properly identify rate limit errors', async () => {
      const client = new AIClient({
        provider: 'openai',
        apiKey: 'test-key',
      });

      mockOpenAICreate.mockRejectedValue(createMockOpenAIError(429, 'Rate limit exceeded'));

      try {
        await client.chat({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
        });
        expect.fail('Should have thrown');
      } catch (error) {
        const aiError = error as AIIntegratorError;
        expect(aiError.type).toBe('rate_limit_error');
        expect(aiError.retryable).toBe(true);
      }
    });
  });

  describe('streaming error scenarios', () => {
    it('should handle non-AIIntegratorError in streaming', async () => {
      const client = new AIClient({
        provider: 'openai',
        apiKey: 'test-key',
      });

      // Throw a regular error (not AIIntegratorError)
      mockOpenAICreate.mockRejectedValue(new TypeError('Unexpected error'));

      const stream = client.chatStream({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Test' }],
      });

      await expect(async () => {
        for await (const chunk of stream) {
          // Should throw before yielding
        }
      }).rejects.toThrow('Unexpected error');
    });

    it('should throw when all providers fail during streaming', async () => {
      const client = new AIClient({
        provider: 'openai',
        apiKey: 'openai-key',
        fallbacks: [
          {
            provider: 'anthropic',
            apiKey: 'anthropic-key',
            priority: 1,
          },
        ],
      });

      // Both providers fail
      mockOpenAICreate.mockRejectedValue(createMockOpenAIError(503, 'OpenAI down'));
      mockAnthropicCreate.mockRejectedValue(createMockAnthropicError(503, 'Anthropic down'));

      const stream = client.chatStream({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Test' }],
      });

      await expect(async () => {
        for await (const chunk of stream) {
          // Should throw
        }
      }).rejects.toThrow();
    });

    it('should throw when streaming fails on last provider', async () => {
      const client = new AIClient({
        provider: 'openai',
        apiKey: 'test-key',
      });

      mockOpenAICreate.mockRejectedValue(
        new AIIntegratorError('api_error', 'Service error', 500, 'openai', true)
      );

      const stream = client.chatStream({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Test' }],
      });

      try {
        for await (const chunk of stream) {
          // Should not yield
        }
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AIIntegratorError);
        const aiError = error as AIIntegratorError;
        expect(aiError.message).toBe('Service error');
      }
    });
  });
});
