/**
 * Example: Using Custom Providers
 *
 * This example demonstrates how to create and use custom LLM providers
 * with the AI Integrator library.
 */

import {
  AIClient,
  BaseProvider,
  type ChatRequest,
  type ChatResponse,
  type StreamChunk,
  type ProviderConfig,
  AIIntegratorError,
  ErrorType,
} from '@ai-integrator/core';

/**
 * Example 1: Custom Provider for a Backend API
 *
 * This example shows how to create a custom provider that connects
 * to your own backend API.
 */
class MyBackendProvider extends BaseProvider {
  readonly type = 'my-backend' as const;

  protected getProviderDefaultModel(): string {
    return 'my-default-model';
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.validateRequest(request);

    try {
      const response = await fetch(`${this.config.baseURL}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model || this.getDefaultModel(),
          messages: request.messages,
          temperature: request.temperature,
          max_tokens: request.max_tokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        id: data.id || crypto.randomUUID(),
        provider: this.type,
        model: data.model || request.model || this.getDefaultModel(),
        message: {
          role: 'assistant',
          content: data.content || data.message?.content,
        },
        finish_reason: data.finish_reason || 'stop',
        usage: data.usage,
        created_at: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async *chatStream(request: ChatRequest): AsyncGenerator<StreamChunk> {
    this.validateRequest(request);

    try {
      const response = await fetch(`${this.config.baseURL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model || this.getDefaultModel(),
          messages: request.messages,
          stream: true,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Stream error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            yield {
              id: data.id || crypto.randomUUID(),
              provider: this.type,
              model: request.model || this.getDefaultModel(),
              delta: {
                content: data.delta?.content,
              },
              finish_reason: data.finish_reason,
            };
          }
        }
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  protected handleError(error: unknown): AIIntegratorError {
    if (error instanceof Error) {
      // Determine error type based on error message or status
      const errorType = error.message.includes('401')
        ? ErrorType.AUTHENTICATION
        : error.message.includes('429')
        ? ErrorType.RATE_LIMIT
        : ErrorType.API_ERROR;

      const retryable = errorType === ErrorType.RATE_LIMIT;

      return new AIIntegratorError(
        errorType,
        error.message,
        undefined,
        this.type,
        retryable,
        error
      );
    }

    return new AIIntegratorError(
      ErrorType.UNKNOWN,
      'Unknown error occurred',
      undefined,
      this.type,
      false,
      error
    );
  }
}

/**
 * Example 2: Using the Custom Provider
 */
async function example1() {
  console.log('Example 1: Using a custom backend provider\n');

  const client = new AIClient({
    provider: 'my-backend',
    customProvider: MyBackendProvider,
    apiKey: process.env.MY_BACKEND_API_KEY || 'demo-key',
    baseURL: 'https://my-backend-api.com/v1',
    debug: true,
  });

  try {
    const response = await client.chat({
      model: 'my-custom-model',
      messages: [
        { role: 'user', content: 'Hello from custom provider!' },
      ],
    });

    console.log('Response:', response.message.content);
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 3: Custom Provider with Fallback
 */
async function example2() {
  console.log('\nExample 2: Custom provider with OpenAI fallback\n');

  const client = new AIClient({
    provider: 'my-backend',
    customProvider: MyBackendProvider,
    apiKey: process.env.MY_BACKEND_API_KEY || 'demo-key',
    baseURL: 'https://my-backend-api.com/v1',
    fallbacks: [
      {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY || '',
        priority: 1,
      },
    ],
  });

  try {
    const response = await client.chat({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: 'This will fallback to OpenAI if custom provider fails' },
      ],
    });

    console.log('Response from:', response.provider);
    console.log('Content:', response.message.content);
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 4: Multiple Custom Providers in Fallback Chain
 */
class AnotherCustomProvider extends BaseProvider {
  readonly type = 'another-custom' as const;

  protected getProviderDefaultModel(): string {
    return 'another-model';
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.validateRequest(request);

    return {
      id: 'custom-id',
      provider: this.type,
      model: request.model || this.getDefaultModel(),
      message: {
        role: 'assistant',
        content: 'Response from another custom provider',
      },
      finish_reason: 'stop',
      created_at: new Date(),
    };
  }

  async *chatStream(request: ChatRequest): AsyncGenerator<StreamChunk> {
    this.validateRequest(request);
    yield {
      id: 'stream-id',
      provider: this.type,
      model: request.model || this.getDefaultModel(),
      delta: { content: 'Streaming...' },
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

async function example3() {
  console.log('\nExample 3: Multiple custom providers in fallback chain\n');

  const client = new AIClient({
    provider: 'my-backend',
    customProvider: MyBackendProvider,
    apiKey: 'key1',
    baseURL: 'https://my-backend-api.com/v1',
    fallbacks: [
      {
        provider: 'another-custom',
        customProvider: AnotherCustomProvider,
        apiKey: 'key2',
        priority: 1,
      },
      {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY || '',
        priority: 2,
      },
    ],
  });

  console.log('Configured providers:', client.getProviders());
}

/**
 * Example 5: Streaming with Custom Provider
 */
async function example4() {
  console.log('\nExample 4: Streaming with custom provider\n');

  const client = new AIClient({
    provider: 'my-backend',
    customProvider: MyBackendProvider,
    apiKey: process.env.MY_BACKEND_API_KEY || 'demo-key',
    baseURL: 'https://my-backend-api.com/v1',
  });

  try {
    const stream = client.chatStream({
      model: 'my-streaming-model',
      messages: [
        { role: 'user', content: 'Stream me a response!' },
      ],
    });

    console.log('Streaming response:');
    for await (const chunk of stream) {
      if (chunk.delta.content) {
        process.stdout.write(chunk.delta.content);
      }
    }
    console.log('\n');
  } catch (error) {
    console.error('Streaming error:', error);
  }
}

// Run examples (comment out if not needed)
if (require.main === module) {
  (async () => {
    await example1();
    await example2();
    await example3();
    await example4();
  })();
}
