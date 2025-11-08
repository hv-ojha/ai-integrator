import { BaseProvider } from './base';
import type {
  ProviderConfig,
  ChatRequest,
  ChatResponse,
  StreamChunk,
  Message,
  AIIntegratorError,
  ErrorType
} from '../core/types';
import { AIIntegratorError as AIError } from '../core/types';

/**
 * Anthropic provider implementation
 */
export class AnthropicProvider extends BaseProvider {
  readonly type = 'anthropic' as const;
  private client: any; // Will be Anthropic client
  private clientPromise: Promise<any> | null = null;

  constructor(config: ProviderConfig) {
    super(config);
  }

  private async initializeClient(): Promise<any> {
    if (this.client) {
      return this.client;
    }

    if (this.clientPromise) {
      return this.clientPromise;
    }

    this.clientPromise = (async () => {
      try {
        const Anthropic = (await import('@anthropic-ai/sdk')).default;
        this.client = new Anthropic({
          apiKey: this.config.apiKey,
          baseURL: this.config.baseURL,
        });
        return this.client;
      } catch (error) {
        throw new AIError(
          'api_error' as ErrorType,
          'Anthropic SDK not found. Please install it: npm install @anthropic-ai/sdk',
          undefined,
          'anthropic',
          false,
          error
        );
      }
    })();

    return this.clientPromise;
  }

  protected getProviderDefaultModel(): string {
    return 'claude-3-5-sonnet-20241022';
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.validateRequest(request);

    try {
      const client = await this.initializeClient();
      // Separate system messages from other messages
      const { system, messages } = this.convertMessages(request.messages);

      const response = await client.messages.create({
        model: request.model || this.getDefaultModel(),
        max_tokens: request.max_tokens || 4096,
        system,
        messages,
        temperature: request.temperature,
        top_p: request.top_p,
        stop_sequences: Array.isArray(request.stop) ? request.stop : request.stop ? [request.stop] : undefined,
        stream: false,
      });

      return this.normalizeResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async *chatStream(request: ChatRequest): AsyncGenerator<StreamChunk, void, unknown> {
    this.validateRequest(request);

    try {
      const client = await this.initializeClient();
      const { system, messages } = this.convertMessages(request.messages);

      const stream = await client.messages.create({
        model: request.model || this.getDefaultModel(),
        max_tokens: request.max_tokens || 4096,
        system,
        messages,
        temperature: request.temperature,
        top_p: request.top_p,
        stop_sequences: Array.isArray(request.stop) ? request.stop : request.stop ? [request.stop] : undefined,
        stream: true,
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          yield this.normalizeStreamChunk(event, stream);
        } else if (event.type === 'message_stop') {
          yield {
            id: (stream as any).message_id || 'unknown',
            provider: 'anthropic',
            model: request.model || this.getDefaultModel(),
            delta: {},
            finish_reason: 'stop',
          };
        }
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private convertMessages(messages: Message[]): { system?: string; messages: any[] } {
    const systemMessages = messages.filter(m => m.role === 'system');
    const otherMessages = messages.filter(m => m.role !== 'system');

    // Anthropic expects system as a separate parameter
    const system = systemMessages.length > 0
      ? systemMessages.map(m => m.content).join('\n\n')
      : undefined;

    // Convert messages to Anthropic format
    const anthropicMessages = otherMessages.map(msg => ({
      role: msg.role === 'function' ? 'assistant' : msg.role, // Map function to assistant
      content: msg.content,
    }));

    return { system, messages: anthropicMessages };
  }

  private normalizeResponse(response: any): ChatResponse {
    const content = response.content[0];

    return {
      id: response.id,
      provider: 'anthropic',
      model: response.model,
      message: {
        role: 'assistant',
        content: content?.text || '',
      },
      finish_reason: this.mapStopReason(response.stop_reason),
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      created_at: new Date(),
    };
  }

  private normalizeStreamChunk(event: any, stream: any): StreamChunk {
    return {
      id: (stream as any).message_id || event.index?.toString() || 'unknown',
      provider: 'anthropic',
      model: (stream as any).model || 'unknown',
      delta: {
        content: event.delta?.text || '',
      },
      finish_reason: undefined,
    };
  }

  private mapStopReason(reason: string | null): ChatResponse['finish_reason'] {
    switch (reason) {
      case 'end_turn':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'stop_sequence':
        return 'stop';
      default:
        return null;
    }
  }

  protected handleError(error: any): AIIntegratorError {
    const statusCode = error?.status || error?.response?.status;
    let errorType: ErrorType = 'api_error' as ErrorType;
    let message = error?.message || 'Unknown error occurred';
    let retryable = false;

    if (statusCode === 401) {
      errorType = 'authentication_error' as ErrorType;
      message = 'Invalid API key';
    } else if (statusCode === 429) {
      errorType = 'rate_limit_error' as ErrorType;
      message = 'Rate limit exceeded';
      retryable = true;
    } else if (statusCode === 400) {
      errorType = 'invalid_request_error' as ErrorType;
      message = error?.error?.message || message;
    } else if (statusCode >= 500) {
      errorType = 'api_error' as ErrorType;
      retryable = true;
    } else if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
      errorType = 'timeout_error' as ErrorType;
      retryable = true;
    } else if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED') {
      errorType = 'network_error' as ErrorType;
      retryable = true;
    }

    return new AIError(
      errorType,
      message,
      statusCode,
      'anthropic',
      retryable,
      error
    );
  }
}
