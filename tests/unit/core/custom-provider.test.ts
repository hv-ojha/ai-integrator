/**
 * Unit tests for Custom Provider Support
 * Tests the custom provider functionality including validation and integration
 */

import { describe, it, expect, vi } from 'vitest';
import { AIClient } from '../../../src/core/client';
import { BaseProvider } from '../../../src/providers/base';
import type {
  ChatRequest,
  ChatResponse,
  StreamChunk,
  ProviderConfig,
} from '../../../src/core/types';
import { ErrorType, AIIntegratorError } from '../../../src/core/types';

// Mock custom provider that extends BaseProvider
class MockCustomProvider extends BaseProvider {
  readonly type = 'mock-custom' as const;

  protected getProviderDefaultModel(): string {
    return 'mock-model-v1';
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.validateRequest(request);

    return {
      id: 'mock-id-123',
      provider: this.type,
      model: request.model || this.getDefaultModel(),
      message: {
        role: 'assistant',
        content: 'Mock custom provider response',
      },
      finish_reason: 'stop',
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      },
      created_at: new Date(),
    };
  }

  async *chatStream(request: ChatRequest): AsyncGenerator<StreamChunk> {
    this.validateRequest(request);

    const words = 'Mock streaming response'.split(' ');
    for (const word of words) {
      yield {
        id: 'mock-stream-id',
        provider: this.type,
        model: request.model || this.getDefaultModel(),
        delta: {
          content: word + ' ',
        },
        finish_reason: null,
      };
    }

    // Final chunk with finish reason
    yield {
      id: 'mock-stream-id',
      provider: this.type,
      model: request.model || this.getDefaultModel(),
      delta: {},
      finish_reason: 'stop',
    };
  }

  protected handleError(error: unknown): AIIntegratorError {
    return new AIIntegratorError(
      ErrorType.API_ERROR,
      error instanceof Error ? error.message : 'Unknown error',
      undefined,
      this.type,
      false,
      error
    );
  }
}

// Failing custom provider for testing error scenarios
class FailingCustomProvider extends BaseProvider {
  readonly type = 'failing-custom' as const;

  protected getProviderDefaultModel(): string {
    return 'failing-model';
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    throw new AIIntegratorError(
      ErrorType.API_ERROR,
      'Custom provider intentionally failed',
      500,
      this.type,
      true
    );
  }

  async *chatStream(request: ChatRequest): AsyncGenerator<StreamChunk> {
    throw new AIIntegratorError(
      ErrorType.API_ERROR,
      'Custom stream intentionally failed',
      500,
      this.type,
      true
    );
  }

  protected handleError(error: unknown): AIIntegratorError {
    return new AIIntegratorError(
      ErrorType.API_ERROR,
      error instanceof Error ? error.message : 'Unknown error',
      undefined,
      this.type,
      false,
      error
    );
  }
}

// Invalid provider that doesn't implement required methods
class InvalidProvider {
  readonly type = 'invalid';
  readonly config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  // Missing chat() method
  // Missing chatStream() method
  // Missing isConfigured() method
}

describe('Custom Provider Support', () => {
  describe('basic custom provider usage', () => {
    it('should accept custom provider class', () => {
      const client = new AIClient({
        provider: 'mock-custom',
        customProvider: MockCustomProvider,
        apiKey: 'test-key',
      });

      expect(client.getPrimaryProvider()).toBe('mock-custom');
    });

    it('should successfully complete chat with custom provider', async () => {
      const client = new AIClient({
        provider: 'mock-custom',
        customProvider: MockCustomProvider,
        apiKey: 'test-key',
      });

      const response = await client.chat({
        model: 'custom-model',
        messages: [{ role: 'user', content: 'Hello custom provider' }],
      });

      expect(response.provider).toBe('mock-custom');
      expect(response.message.content).toBe('Mock custom provider response');
      expect(response.model).toBe('custom-model');
    });

    it('should use default model when not specified', async () => {
      const client = new AIClient({
        provider: 'mock-custom',
        customProvider: MockCustomProvider,
        apiKey: 'test-key',
      });

      const response = await client.chat({
        model: '',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(response.model).toBe('mock-model-v1');
    });

    it('should successfully stream with custom provider', async () => {
      const client = new AIClient({
        provider: 'mock-custom',
        customProvider: MockCustomProvider,
        apiKey: 'test-key',
      });

      const chunks: string[] = [];
      const stream = client.chatStream({
        model: 'custom-model',
        messages: [{ role: 'user', content: 'Stream test' }],
      });

      for await (const chunk of stream) {
        if (chunk.delta.content) {
          chunks.push(chunk.delta.content);
        }
      }

      expect(chunks.join('')).toBe('Mock streaming response ');
    });
  });

  describe('custom provider validation', () => {
    it('should validate that custom provider implements IProvider', () => {
      expect(() => {
        new AIClient({
          provider: 'invalid',
          customProvider: InvalidProvider as any,
          apiKey: 'test-key',
        });
      }).toThrow('Custom provider must implement');
    });

    it('should throw error for unknown provider without customProvider', () => {
      expect(() => {
        new AIClient({
          provider: 'unknown-provider' as any,
          apiKey: 'test-key',
        });
      }).toThrow(/Unknown provider: unknown-provider/);
    });

    it('should validate custom provider has type property', () => {
      class NoTypeProvider extends BaseProvider {
        readonly type = '' as any;

        protected getProviderDefaultModel(): string {
          return 'model';
        }

        async chat(request: ChatRequest): Promise<ChatResponse> {
          throw new Error('Not implemented');
        }

        async *chatStream(request: ChatRequest): AsyncGenerator<StreamChunk> {
          throw new Error('Not implemented');
        }

        protected handleError(error: unknown): AIIntegratorError {
          throw new Error('Not implemented');
        }
      }

      // Override type to be invalid
      const ProviderWithNoType = class extends NoTypeProvider {
        get type() {
          return undefined as any;
        }
      };

      expect(() => {
        new AIClient({
          provider: 'no-type',
          customProvider: ProviderWithNoType as any,
          apiKey: 'test-key',
        });
      }).toThrow('Custom provider must have a "type" property');
    });
  });

  describe('custom provider with fallbacks', () => {
    it('should support multiple custom providers in fallback chain', async () => {
      const client = new AIClient({
        provider: 'failing-custom',
        customProvider: FailingCustomProvider,
        apiKey: 'key1',
        retry: { maxRetries: 0 },
        fallbacks: [
          {
            provider: 'mock-custom',
            customProvider: MockCustomProvider,
            apiKey: 'key2',
            priority: 1,
          },
        ],
      });

      const response = await client.chat({
        model: 'test-model',
        messages: [{ role: 'user', content: 'Test' }],
      });

      expect(response.provider).toBe('mock-custom');
      expect(response.message.content).toBe('Mock custom provider response');
    });

    it('should fallback between custom providers with different types', async () => {
      // Create another custom provider
      class AnotherCustomProvider extends BaseProvider {
        readonly type = 'another-custom' as const;

        protected getProviderDefaultModel(): string {
          return 'another-model';
        }

        async chat(request: ChatRequest): Promise<ChatResponse> {
          return {
            id: 'another-id',
            provider: this.type,
            model: request.model || this.getDefaultModel(),
            message: {
              role: 'assistant',
              content: 'Another custom provider response',
            },
            finish_reason: 'stop',
            created_at: new Date(),
          };
        }

        async *chatStream(request: ChatRequest): AsyncGenerator<StreamChunk> {
          yield {
            id: 'stream-id',
            provider: this.type,
            model: request.model || this.getDefaultModel(),
            delta: { content: 'Stream' },
            finish_reason: 'stop',
          };
        }

        protected handleError(error: unknown): AIIntegratorError {
          return new AIIntegratorError(
            ErrorType.API_ERROR,
            error instanceof Error ? error.message : 'Unknown error',
            undefined,
            this.type,
            false,
            error
          );
        }
      }

      const client = new AIClient({
        provider: 'failing-custom',
        customProvider: FailingCustomProvider,
        apiKey: 'key1',
        retry: { maxRetries: 0 },
        fallbacks: [
          {
            provider: 'another-custom',
            customProvider: AnotherCustomProvider,
            apiKey: 'key2',
            priority: 1,
          },
          {
            provider: 'mock-custom',
            customProvider: MockCustomProvider,
            apiKey: 'key3',
            priority: 2,
          },
        ],
      });

      const response = await client.chat({
        model: 'test-model',
        messages: [{ role: 'user', content: 'Test' }],
      });

      expect(response.provider).toBe('another-custom');
      expect(response.message.content).toBe('Another custom provider response');
    });
  });

  describe('custom provider streaming with fallbacks', () => {
    it('should fallback during streaming if custom provider fails', async () => {
      const client = new AIClient({
        provider: 'failing-custom',
        customProvider: FailingCustomProvider,
        apiKey: 'key1',
        retry: { maxRetries: 0 },
        fallbacks: [
          {
            provider: 'mock-custom',
            customProvider: MockCustomProvider,
            apiKey: 'key2',
            priority: 1,
          },
        ],
      });

      const chunks: string[] = [];
      const stream = client.chatStream({
        model: 'test-model',
        messages: [{ role: 'user', content: 'Stream test' }],
      });

      for await (const chunk of stream) {
        if (chunk.delta.content) {
          chunks.push(chunk.delta.content);
        }
      }

      expect(chunks.join('')).toBe('Mock streaming response ');
    });
  });

  describe('custom provider info methods', () => {
    it('should return custom provider in getProviders()', () => {
      const client = new AIClient({
        provider: 'mock-custom',
        customProvider: MockCustomProvider,
        apiKey: 'test-key',
        fallbacks: [
          {
            provider: 'openai',
            apiKey: 'openai-key',
            priority: 1,
          },
        ],
      });

      const providers = client.getProviders();
      expect(providers).toEqual(['mock-custom', 'openai']);
    });

    it('should check if custom provider is configured with hasProvider()', () => {
      const client = new AIClient({
        provider: 'mock-custom',
        customProvider: MockCustomProvider,
        apiKey: 'test-key',
      });

      expect(client.hasProvider('mock-custom')).toBe(true);
      expect(client.hasProvider('openai')).toBe(false);
    });
  });

  describe('custom provider error handling', () => {
    it('should properly handle errors from custom provider', async () => {
      const client = new AIClient({
        provider: 'failing-custom',
        customProvider: FailingCustomProvider,
        apiKey: 'test-key',
        retry: { maxRetries: 0 },
      });

      await expect(
        client.chat({
          model: 'test-model',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow();
    });

    it('should throw when all custom providers fail', async () => {
      const client = new AIClient({
        provider: 'failing-custom',
        customProvider: FailingCustomProvider,
        apiKey: 'test-key',
        retry: { maxRetries: 0 },
      });

      await expect(
        client.chat({
          model: 'test-model',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow();
    });
  });

  describe('custom provider with custom config', () => {
    it('should pass custom baseURL to custom provider', () => {
      const customBaseURL = 'https://my-custom-api.com/v1';

      const client = new AIClient({
        provider: 'mock-custom',
        customProvider: MockCustomProvider,
        apiKey: 'test-key',
        baseURL: customBaseURL,
      });

      // Access the primary provider's config
      const providers = (client as any).primaryProvider;
      expect(providers.config.baseURL).toBe(customBaseURL);
    });

    it('should pass custom defaultModel to custom provider', async () => {
      const client = new AIClient({
        provider: 'mock-custom',
        customProvider: MockCustomProvider,
        apiKey: 'test-key',
        defaultModel: 'my-custom-default-model',
      });

      const response = await client.chat({
        model: '', // Use default
        messages: [{ role: 'user', content: 'Test' }],
      });

      expect(response.model).toBe('my-custom-default-model');
    });
  });

  describe('type safety and TypeScript compliance', () => {
    it('should allow string provider type with custom provider', () => {
      const client = new AIClient({
        provider: 'any-custom-string-identifier',
        customProvider: MockCustomProvider,
        apiKey: 'test-key',
      });

      expect(client.getPrimaryProvider()).toBe('mock-custom');
    });

    it('should export BaseProvider for users to extend', () => {
      // BaseProvider is already imported at the top of this file
      expect(BaseProvider).toBeDefined();
      expect(typeof BaseProvider).toBe('function');
    });

    it('should allow extending BaseProvider', () => {
      // Verify that MockCustomProvider is an instance of BaseProvider
      const config = { provider: 'test' as const, apiKey: 'test-key' };
      const instance = new MockCustomProvider(config);
      expect(instance).toBeInstanceOf(BaseProvider);
    });
  });
});
