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
 * OpenAI provider implementation
 */
export class OpenAIProvider extends BaseProvider {
  readonly type = 'openai' as const;
  private client: any; // Will be OpenAI client
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
        // Dynamic import to keep the package lightweight
        // Users only load this if they use OpenAI
        const OpenAI = (await import('openai')).default;
        this.client = new OpenAI({
          apiKey: this.config.apiKey,
          baseURL: this.config.baseURL,
          organization: this.config.organization,
        });
        return this.client;
      } catch (error) {
        throw new AIError(
          'api_error' as ErrorType,
          'OpenAI SDK not found. Please install it: npm install openai',
          undefined,
          'openai',
          false,
          error
        );
      }
    })();

    return this.clientPromise;
  }

  protected getProviderDefaultModel(): string {
    return 'gpt-4o-mini';
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.validateRequest(request);

    try {
      const client = await this.initializeClient();
      const response = await client.chat.completions.create({
        model: request.model || this.getDefaultModel(),
        messages: this.convertMessages(request.messages),
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        top_p: request.top_p,
        frequency_penalty: request.frequency_penalty,
        presence_penalty: request.presence_penalty,
        stop: request.stop,

        // MODERN API (preferred)
        ...(request.tools && { tools: request.tools }),
        ...(request.tool_choice && { tool_choice: request.tool_choice }),
        ...(request.parallel_tool_calls !== undefined && {
          parallel_tool_calls: request.parallel_tool_calls
        }),

        // BACKWARD COMPATIBILITY
        ...(request.functions && { functions: request.functions }),
        ...(request.function_call && { function_call: request.function_call }),

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
      const stream = await client.chat.completions.create({
        model: request.model || this.getDefaultModel(),
        messages: this.convertMessages(request.messages),
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        top_p: request.top_p,
        frequency_penalty: request.frequency_penalty,
        presence_penalty: request.presence_penalty,
        stop: request.stop,

        // MODERN API (preferred)
        ...(request.tools && { tools: request.tools }),
        ...(request.tool_choice && { tool_choice: request.tool_choice }),
        ...(request.parallel_tool_calls !== undefined && {
          parallel_tool_calls: request.parallel_tool_calls
        }),

        // BACKWARD COMPATIBILITY
        ...(request.functions && { functions: request.functions }),
        ...(request.function_call && { function_call: request.function_call }),

        stream: true,
      });

      for await (const chunk of stream) {
        yield this.normalizeStreamChunk(chunk);
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private convertMessages(messages: Message[]): any[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      name: msg.name,

      // MODERN: Tool calling support
      tool_calls: msg.tool_calls,
      tool_call_id: msg.tool_call_id,

      // DEPRECATED: Backward compatibility
      function_call: msg.function_call,
    }));
  }

  private normalizeResponse(response: any): ChatResponse {
    const choice = response.choices[0];
    const message = choice.message;

    return {
      id: response.id,
      provider: 'openai',
      model: response.model,
      message: {
        role: message.role,
        content: message.content,

        // MODERN: Tool calling support
        tool_calls: message.tool_calls?.map((tc: any) => ({
          id: tc.id,
          type: tc.type,
          function: tc.function,
        })),

        // DEPRECATED: Backward compatibility
        function_call: message.function_call,
      },
      finish_reason: choice.finish_reason,
      usage: response.usage ? {
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: response.usage.completion_tokens,
        total_tokens: response.usage.total_tokens,
      } : undefined,
      created_at: new Date(response.created * 1000),
    };
  }

  private normalizeStreamChunk(chunk: any): StreamChunk {
    const choice = chunk.choices[0];
    const delta = choice?.delta || {};

    return {
      id: chunk.id,
      provider: 'openai',
      model: chunk.model,
      delta: {
        role: delta.role,
        content: delta.content,

        // MODERN: Tool calling support
        tool_calls: delta.tool_calls?.map((tc: any) => ({
          index: tc.index,
          id: tc.id,
          type: tc.type,
          function: tc.function,
        })),

        // DEPRECATED: Backward compatibility
        function_call: delta.function_call,
      },
      finish_reason: choice?.finish_reason,
    };
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
      'openai',
      retryable,
      error
    );
  }
}
