/**
 * Tests for Gemini provider
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiProvider } from '../../../src/providers/gemini';
import {
  createMockGeminiResponse,
  createMockGeminiStreamResult,
  createMockGeminiError,
} from '../../mocks/gemini.mock';
import { AIIntegratorError } from '../../../src/core/types';

// Create mock instances
const mockSendMessage = vi.fn();
const mockSendMessageStream = vi.fn();
const mockStartChat = vi.fn(() => ({
  sendMessage: mockSendMessage,
  sendMessageStream: mockSendMessageStream,
}));
const mockGetGenerativeModel = vi.fn(() => ({
  startChat: mockStartChat,
}));

// Mock the google generative ai module
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

describe('GeminiProvider', () => {
  let provider: GeminiProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new GeminiProvider({
      provider: 'gemini',
      apiKey: 'test-api-key',
    });
  });

  describe('initialization', () => {
    it('should initialize with correct type', () => {
      expect(provider.type).toBe('gemini');
    });

    it('should be configured when api key is provided', () => {
      expect(provider.isConfigured()).toBe(true);
    });

    it('should throw error when API key is not provided', () => {
      expect(() => {
        new GeminiProvider({
          provider: 'gemini',
          apiKey: '',
        });
      }).toThrow('API key is required but was not provided');
    });

    it('should throw error when API key is only whitespace', () => {
      expect(() => {
        new GeminiProvider({
          provider: 'gemini',
          apiKey: '   ',
        });
      }).toThrow('API key is required but was not provided');
    });

    it('should throw error when API key is undefined', () => {
      expect(() => {
        new GeminiProvider({
          provider: 'gemini',
          apiKey: undefined as any,
        });
      }).toThrow('API key is required but was not provided');
    });
  });

  describe('chat', () => {
    it('should successfully complete a chat request', async () => {
      const mockResponse = createMockGeminiResponse('Hello from Gemini!');
      mockSendMessage.mockResolvedValue(mockResponse);

      const response = await provider.chat({
        model: 'gemini-2.0-flash-exp',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(response).toMatchObject({
        provider: 'gemini',
        model: 'gemini-2.0-flash-exp',
        message: {
          role: 'assistant',
          content: 'Hello from Gemini!',
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
      const mockResponse = createMockGeminiResponse();
      mockSendMessage.mockResolvedValue(mockResponse);

      await provider.chat({
        model: 'gemini-2.0-flash-exp',
        messages: [
          { role: 'system', content: 'You are helpful' },
          { role: 'user', content: 'Hello' },
        ],
      });

      expect(mockStartChat).toHaveBeenCalledWith(
        expect.objectContaining({
          systemInstruction: 'You are helpful',
        })
      );
    });

    it('should convert role names correctly', async () => {
      const mockResponse = createMockGeminiResponse();
      mockSendMessage.mockResolvedValue(mockResponse);

      await provider.chat({
        model: 'gemini-2.0-flash-exp',
        messages: [
          { role: 'user', content: 'Question' },
          { role: 'assistant', content: 'Answer' },
          { role: 'user', content: 'Follow-up' },
        ],
      });

      const chatHistory = mockStartChat.mock.calls[0][0].history;
      expect(chatHistory).toHaveLength(2);
      expect(chatHistory[0].role).toBe('user');
      expect(chatHistory[1].role).toBe('model'); // assistant -> model
    });

    it('should use default model if not specified', async () => {
      const mockResponse = createMockGeminiResponse();
      mockSendMessage.mockResolvedValue(mockResponse);

      await provider.chat({
        model: '',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(mockGetGenerativeModel).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.0-flash-exp',
        })
      );
    });

    it('should pass generation config correctly', async () => {
      const mockResponse = createMockGeminiResponse();
      mockSendMessage.mockResolvedValue(mockResponse);

      await provider.chat({
        model: 'gemini-2.0-flash-exp',
        messages: [{ role: 'user', content: 'Test' }],
        temperature: 0.8,
        max_tokens: 1000,
        top_p: 0.9,
        stop: ['END'],
      });

      expect(mockGetGenerativeModel).toHaveBeenCalledWith(
        expect.objectContaining({
          generationConfig: expect.objectContaining({
            temperature: 0.8,
            maxOutputTokens: 1000,
            topP: 0.9,
            stopSequences: ['END'],
          }),
        })
      );
    });

    it('should map finish reasons correctly', async () => {
      const response = createMockGeminiResponse();
      response.response.candidates[0].finishReason = 'MAX_TOKENS';
      mockSendMessage.mockResolvedValue(response);

      const result = await provider.chat({
        model: 'gemini-2.0-flash-exp',
        messages: [{ role: 'user', content: 'Test' }],
      });

      expect(result.finish_reason).toBe('length');
    });

    it('should map SAFETY finish reason to content_filter', async () => {
      const response = createMockGeminiResponse();
      response.response.candidates[0].finishReason = 'SAFETY';
      mockSendMessage.mockResolvedValue(response);

      const result = await provider.chat({
        model: 'gemini-2.0-flash-exp',
        messages: [{ role: 'user', content: 'Test' }],
      });

      expect(result.finish_reason).toBe('content_filter');
    });

    it('should handle API errors correctly', async () => {
      const error = createMockGeminiError('Invalid API key');
      mockSendMessage.mockRejectedValue(error);

      try {
        await provider.chat({
          model: 'gemini-2.0-flash-exp',
          messages: [{ role: 'user', content: 'Test' }],
        });
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(AIIntegratorError);
        const aiError = e as AIIntegratorError;
        expect(aiError.type).toBe('authentication_error');
        expect(aiError.provider).toBe('gemini');
      }
    });
  });

  describe('chatStream', () => {
    it('should successfully stream responses', async () => {
      const mockStreamResult = createMockGeminiStreamResult('Hello streaming Gemini');
      mockSendMessageStream.mockResolvedValue(mockStreamResult);

      const chunks: string[] = [];
      const stream = provider.chatStream({
        model: 'gemini-2.0-flash-exp',
        messages: [{ role: 'user', content: 'Stream test' }],
      });

      for await (const chunk of stream) {
        if (chunk.delta.content) {
          chunks.push(chunk.delta.content);
        }
      }

      expect(chunks.join('')).toBe('Hello streaming Gemini');
    });

    it('should include finish_reason in last chunk', async () => {
      const mockStreamResult = createMockGeminiStreamResult('Test');
      mockSendMessageStream.mockResolvedValue(mockStreamResult);

      const chunks: any[] = [];
      const stream = provider.chatStream({
        model: 'gemini-2.0-flash-exp',
        messages: [{ role: 'user', content: 'Test' }],
      });

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const lastChunk = chunks[chunks.length - 1];
      expect(lastChunk.finish_reason).toBe('stop');
    });

    it('should handle system messages in streaming', async () => {
      const mockStreamResult = createMockGeminiStreamResult('Response');
      mockSendMessageStream.mockResolvedValue(mockStreamResult);

      const stream = provider.chatStream({
        model: 'gemini-2.0-flash-exp',
        messages: [
          { role: 'system', content: 'System prompt' },
          { role: 'user', content: 'Test' },
        ],
      });

      for await (const chunk of stream) {
        // Just consume the stream
      }

      expect(mockStartChat).toHaveBeenCalledWith(
        expect.objectContaining({
          systemInstruction: 'System prompt',
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle API key errors', async () => {
      const error = createMockGeminiError('API key not found');
      mockSendMessage.mockRejectedValue(error);

      try {
        await provider.chat({
          model: 'gemini-2.0-flash-exp',
          messages: [{ role: 'user', content: 'Test' }],
        });
      } catch (e) {
        const aiError = e as AIIntegratorError;
        expect(aiError.type).toBe('authentication_error');
        expect(aiError.statusCode).toBe(401);
      }
    });

    it('should handle quota errors as rate limit', async () => {
      const error = createMockGeminiError('Quota exceeded');
      mockSendMessage.mockRejectedValue(error);

      try {
        await provider.chat({
          model: 'gemini-2.0-flash-exp',
          messages: [{ role: 'user', content: 'Test' }],
        });
      } catch (e) {
        const aiError = e as AIIntegratorError;
        expect(aiError.type).toBe('rate_limit_error');
        expect(aiError.retryable).toBe(true);
      }
    });

    it('should handle rate limit errors', async () => {
      const error = createMockGeminiError('rate limit exceeded');
      mockSendMessage.mockRejectedValue(error);

      try {
        await provider.chat({
          model: 'gemini-2.0-flash-exp',
          messages: [{ role: 'user', content: 'Test' }],
        });
      } catch (e) {
        const aiError = e as AIIntegratorError;
        expect(aiError.type).toBe('rate_limit_error');
        expect(aiError.retryable).toBe(true);
      }
    });

    it('should handle invalid request errors', async () => {
      const error = createMockGeminiError('invalid request');
      mockSendMessage.mockRejectedValue(error);

      try {
        await provider.chat({
          model: 'gemini-2.0-flash-exp',
          messages: [{ role: 'user', content: 'Test' }],
        });
      } catch (e) {
        const aiError = e as AIIntegratorError;
        expect(aiError.type).toBe('invalid_request_error');
        expect(aiError.statusCode).toBe(400);
      }
    });

    it('should handle network errors', async () => {
      const error = createMockGeminiError('network error occurred');
      mockSendMessage.mockRejectedValue(error);

      try {
        await provider.chat({
          model: 'gemini-2.0-flash-exp',
          messages: [{ role: 'user', content: 'Test' }],
        });
      } catch (e) {
        const aiError = e as AIIntegratorError;
        expect(aiError.type).toBe('network_error');
        expect(aiError.retryable).toBe(true);
      }
    });

    it('should handle timeout errors', async () => {
      const error = createMockGeminiError('timeout occurred');
      mockSendMessage.mockRejectedValue(error);

      try {
        await provider.chat({
          model: 'gemini-2.0-flash-exp',
          messages: [{ role: 'user', content: 'Test' }],
        });
      } catch (e) {
        const aiError = e as AIIntegratorError;
        expect(aiError.type).toBe('timeout_error');
        expect(aiError.retryable).toBe(true);
      }
    });
  });

  describe('id generation', () => {
    it('should generate unique IDs for responses', async () => {
      const mockResponse = createMockGeminiResponse();
      mockSendMessage.mockResolvedValue(mockResponse);

      const response1 = await provider.chat({
        model: 'gemini-2.0-flash-exp',
        messages: [{ role: 'user', content: 'Test 1' }],
      });

      const response2 = await provider.chat({
        model: 'gemini-2.0-flash-exp',
        messages: [{ role: 'user', content: 'Test 2' }],
      });

      expect(response1.id).not.toBe(response2.id);
      expect(response1.id).toMatch(/^gemini-/);
    });
  });
});
