/**
 * Tests for OpenAI provider
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create mock function - must be defined before vi.mock
const mockCreate = vi.fn();

// Mock the openai module - MUST be before other imports
vi.mock('openai', async () => {
  return {
    default: vi.fn(function() {
      return {
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      };
    }),
  };
});

import { OpenAIProvider } from '../../../src/providers/openai';
import {
  createMockOpenAIResponse,
  createMockOpenAIStream,
  createMockOpenAIError,
  createMockOpenAIResponseWithToolCalls,
  createMockOpenAIStreamWithToolCalls,
} from '../../mocks/openai.mock';
import { AIIntegratorError } from '../../../src/core/types';

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new OpenAIProvider({
      provider: 'openai',
      apiKey: 'test-api-key',
    });
  });

  describe('initialization', () => {
    it('should initialize with correct type', () => {
      expect(provider.type).toBe('openai');
    });

    it('should be configured when api key is provided', () => {
      expect(provider.isConfigured()).toBe(true);
    });

    it('should throw error when API key is not provided', () => {
      expect(() => {
        new OpenAIProvider({
          provider: 'openai',
          apiKey: '',
        });
      }).toThrow('API key is required but was not provided');
    });

    it('should throw error when API key is only whitespace', () => {
      expect(() => {
        new OpenAIProvider({
          provider: 'openai',
          apiKey: '   ',
        });
      }).toThrow('API key is required but was not provided');
    });

    it('should throw error when API key is undefined', () => {
      expect(() => {
        new OpenAIProvider({
          provider: 'openai',
          apiKey: undefined as any,
        });
      }).toThrow('API key is required but was not provided');
    });
  });

  describe('chat', () => {
    it('should successfully complete a chat request', async () => {
      const mockResponse = createMockOpenAIResponse('Hello, world!');
      mockCreate.mockResolvedValue(mockResponse);

      const response = await provider.chat({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(response).toMatchObject({
        provider: 'openai',
        model: 'gpt-4o-mini',
        message: {
          role: 'assistant',
          content: 'Hello, world!',
        },
        finish_reason: 'stop',
      });

      expect(response.usage).toMatchObject({
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Hello' }],
          stream: false,
        })
      );
    });

    it('should use default model if not specified', async () => {
      const mockResponse = createMockOpenAIResponse();
      mockCreate.mockResolvedValue(mockResponse);

      await provider.chat({
        model: '',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
        })
      );
    });

    it('should pass all parameters correctly', async () => {
      const mockResponse = createMockOpenAIResponse();
      mockCreate.mockResolvedValue(mockResponse);

      await provider.chat({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Test' }],
        temperature: 0.8,
        max_tokens: 500,
        top_p: 0.9,
        frequency_penalty: 0.5,
        presence_penalty: 0.5,
        stop: ['END'],
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o',
          temperature: 0.8,
          max_tokens: 500,
          top_p: 0.9,
          frequency_penalty: 0.5,
          presence_penalty: 0.5,
          stop: ['END'],
        })
      );
    });

    it('should throw error if messages array is empty', async () => {
      await expect(
        provider.chat({
          model: 'gpt-4o-mini',
          messages: [],
        })
      ).rejects.toThrow(/Messages array cannot be empty/);
    });

    it('should throw error for invalid temperature', async () => {
      await expect(
        provider.chat({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
          temperature: 3,
        })
      ).rejects.toThrow(/Temperature must be between 0 and 2/);
    });

    it('should handle API errors correctly', async () => {
      const error = createMockOpenAIError(401, 'Invalid API key');
      mockCreate.mockRejectedValue(error);

      try {
        await provider.chat({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
        });
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(AIIntegratorError);
        const aiError = e as AIIntegratorError;
        expect(aiError.type).toBe('authentication_error');
        expect(aiError.statusCode).toBe(401);
        expect(aiError.provider).toBe('openai');
        expect(aiError.retryable).toBe(false);
      }
    });

    it('should mark rate limit errors as retryable', async () => {
      const error = createMockOpenAIError(429, 'Rate limit exceeded');
      mockCreate.mockRejectedValue(error);

      try {
        await provider.chat({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
        });
        expect.fail('Should have thrown');
      } catch (e) {
        const aiError = e as AIIntegratorError;
        expect(aiError.type).toBe('rate_limit_error');
        expect(aiError.retryable).toBe(true);
      }
    });

    it('should mark server errors as retryable', async () => {
      const error = createMockOpenAIError(500, 'Internal server error');
      mockCreate.mockRejectedValue(error);

      try {
        await provider.chat({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
        });
        expect.fail('Should have thrown');
      } catch (e) {
        const aiError = e as AIIntegratorError;
        expect(aiError.type).toBe('api_error');
        expect(aiError.retryable).toBe(true);
      }
    });
  });

  describe('chatStream', () => {
    it('should successfully stream responses', async () => {
      const mockStream = createMockOpenAIStream('Hello streaming world');
      mockCreate.mockResolvedValue(mockStream);

      const chunks: string[] = [];
      const stream = provider.chatStream({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Stream test' }],
      });

      for await (const chunk of stream) {
        if (chunk.delta.content) {
          chunks.push(chunk.delta.content);
        }
      }

      expect(chunks.join('')).toBe('Hello streaming world');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          stream: true,
        })
      );
    });

    it('should include finish_reason in last chunk', async () => {
      const mockStream = createMockOpenAIStream('Test');
      mockCreate.mockResolvedValue(mockStream);

      const chunks: any[] = [];
      const stream = provider.chatStream({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Test' }],
      });

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const lastChunk = chunks[chunks.length - 1];
      expect(lastChunk.finish_reason).toBe('stop');
    });

    it('should handle streaming errors', async () => {
      const error = createMockOpenAIError(500, 'Stream error');
      mockCreate.mockRejectedValue(error);

      const stream = provider.chatStream({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Test' }],
      });

      await expect(async () => {
        for await (const chunk of stream) {
          // Should throw before yielding
        }
      }).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle authentication errors', async () => {
      const error = createMockOpenAIError(401, 'Invalid API key');
      mockCreate.mockRejectedValue(error);

      try {
        await provider.chat({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
        });
      } catch (e) {
        const aiError = e as AIIntegratorError;
        expect(aiError.type).toBe('authentication_error');
        expect(aiError.message).toContain('Invalid API key');
      }
    });

    it('should handle rate limit errors', async () => {
      const error = createMockOpenAIError(429, 'Rate limit exceeded');
      mockCreate.mockRejectedValue(error);

      try {
        await provider.chat({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
        });
      } catch (e) {
        const aiError = e as AIIntegratorError;
        expect(aiError.type).toBe('rate_limit_error');
      }
    });

    it('should handle invalid request errors', async () => {
      const error = createMockOpenAIError(400, 'Bad request');
      mockCreate.mockRejectedValue(error);

      try {
        await provider.chat({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
        });
      } catch (e) {
        const aiError = e as AIIntegratorError;
        expect(aiError.type).toBe('invalid_request_error');
      }
    });

    it('should handle network errors', async () => {
      const error: any = new Error('Network error');
      error.code = 'ECONNREFUSED';
      mockCreate.mockRejectedValue(error);

      try {
        await provider.chat({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
        });
      } catch (e) {
        const aiError = e as AIIntegratorError;
        expect(aiError.type).toBe('network_error');
        expect(aiError.retryable).toBe(true);
      }
    });

    it('should handle timeout errors', async () => {
      const error: any = new Error('Timeout');
      error.code = 'ETIMEDOUT';
      mockCreate.mockRejectedValue(error);

      try {
        await provider.chat({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
        });
      } catch (e) {
        const aiError = e as AIIntegratorError;
        expect(aiError.type).toBe('timeout_error');
        expect(aiError.retryable).toBe(true);
      }
    });
  });

  describe('tool calling support', () => {
    it('should handle response with tool_calls', async () => {
      const mockToolCalls = [
        {
          id: 'call_123',
          type: 'function',
          function: {
            name: 'get_weather',
            arguments: JSON.stringify({ location: 'San Francisco' }),
          },
        },
      ];

      const mockResponse = createMockOpenAIResponseWithToolCalls(mockToolCalls);
      mockCreate.mockResolvedValue(mockResponse);

      const response = await provider.chat({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'What is the weather?' }],
      });

      expect(response.message.tool_calls).toHaveLength(1);
      expect(response.message.tool_calls![0]).toMatchObject({
        id: 'call_123',
        type: 'function',
        function: {
          name: 'get_weather',
          arguments: JSON.stringify({ location: 'San Francisco' }),
        },
      });
      expect(response.finish_reason).toBe('tool_calls');
    });

    it('should handle streaming with tool_calls', async () => {
      const mockToolCalls = [
        {
          id: 'call_456',
          type: 'function',
          function: {
            name: 'calculate',
            arguments: JSON.stringify({ expression: '2+2' }),
          },
        },
      ];

      const mockStream = createMockOpenAIStreamWithToolCalls(mockToolCalls);
      mockCreate.mockResolvedValue(mockStream);

      const chunks: any[] = [];
      const stream = provider.chatStream({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Calculate 2+2' }],
      });

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      // Find chunk with tool_calls
      const toolCallChunks = chunks.filter((c) => c.delta.tool_calls);
      expect(toolCallChunks.length).toBeGreaterThan(0);
      expect(toolCallChunks[0].delta.tool_calls![0]).toMatchObject({
        index: 0,
        id: 'call_456',
        type: 'function',
        function: {
          name: 'calculate',
          arguments: JSON.stringify({ expression: '2+2' }),
        },
      });

      // Last chunk should have finish_reason
      const lastChunk = chunks[chunks.length - 1];
      expect(lastChunk.finish_reason).toBe('tool_calls');
    });
  });
});
