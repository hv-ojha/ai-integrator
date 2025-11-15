import { BaseProvider } from './base';
import type {
  ProviderConfig,
  ChatRequest,
  ChatResponse,
  StreamChunk,
  Message,
  AIIntegratorError,
  ErrorType,
  ToolDefinition
} from '../core/types';
import { AIIntegratorError as AIError } from '../core/types';
import {
  toGeminiFunctionDeclarations,
  fromGeminiResponse
} from '../utils/gemini-tool-transformer';

/**
 * Google Gemini provider implementation
 */
export class GeminiProvider extends BaseProvider {
  readonly type = 'gemini' as const;
  private client: any; // Will be GoogleGenerativeAI client
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
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        this.client = new GoogleGenerativeAI(this.config.apiKey);
        return this.client;
      } catch (error) {
        throw new AIError(
          'api_error' as ErrorType,
          'Google Generative AI SDK not found. Please install it: npm install @google/generative-ai',
          undefined,
          'gemini',
          false,
          error
        );
      }
    })();

    return this.clientPromise;
  }

  protected getProviderDefaultModel(): string {
    return 'gemini-2.0-flash-exp';
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.validateRequest(request);

    try {
      const client = await this.initializeClient();
      const modelName = request.model || this.getDefaultModel();
      const model = client.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: request.temperature,
          maxOutputTokens: request.max_tokens,
          topP: request.top_p,
          stopSequences: Array.isArray(request.stop) ? request.stop : request.stop ? [request.stop] : undefined,
        },
        // NEW: Tool support
        ...(request.tools && {
          tools: toGeminiFunctionDeclarations(request.tools),
        }),
      });

      const { systemInstruction, contents } = this.convertMessages(request.messages, request.tools);

      // Start chat with history
      const chat = model.startChat({
        history: contents.slice(0, -1),
        systemInstruction,
      });

      // Send last message
      const lastMessage = contents[contents.length - 1];
      const result = await chat.sendMessage(lastMessage.parts[0].text || lastMessage.parts);
      const response = result.response;

      return this.normalizeResponse(response, modelName);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async *chatStream(request: ChatRequest): AsyncGenerator<StreamChunk, void, unknown> {
    this.validateRequest(request);

    try {
      const client = await this.initializeClient();
      const modelName = request.model || this.getDefaultModel();
      const model = client.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: request.temperature,
          maxOutputTokens: request.max_tokens,
          topP: request.top_p,
          stopSequences: Array.isArray(request.stop) ? request.stop : request.stop ? [request.stop] : undefined,
        },
        // NEW: Tool support
        ...(request.tools && {
          tools: toGeminiFunctionDeclarations(request.tools),
        }),
      });

      const { systemInstruction, contents } = this.convertMessages(request.messages, request.tools);

      const chat = model.startChat({
        history: contents.slice(0, -1),
        systemInstruction,
      });

      const lastMessage = contents[contents.length - 1];
      const result = await chat.sendMessageStream(lastMessage.parts[0].text || lastMessage.parts);

      let chunkIndex = 0;
      for await (const chunk of result.stream) {
        yield this.normalizeStreamChunk(chunk, modelName, chunkIndex++);
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private convertMessages(messages: Message[], _tools?: ToolDefinition[]): { systemInstruction?: string; contents: any[] } {
    const systemMessages = messages.filter(m => m.role === 'system');
    const otherMessages = messages.filter(m => m.role !== 'system');

    const systemInstruction = systemMessages.length > 0
      ? systemMessages.map(m => m.content).join('\n\n')
      : undefined;

    // Build a map of tool_call_id -> function name for Gemini
    const toolCallMap = new Map<string, string>();
    otherMessages.forEach(msg => {
      if (msg.tool_calls) {
        msg.tool_calls.forEach(tc => {
          toolCallMap.set(tc.id, tc.function.name);
        });
      }
    });

    // Convert to Gemini format
    const contents = otherMessages.map(msg => {
      // Handle tool response messages
      if (msg.role === 'tool') {
        // Get function name from either msg.name or by looking up tool_call_id
        const functionName = msg.name || (msg.tool_call_id ? toolCallMap.get(msg.tool_call_id) : undefined);

        if (!functionName) {
          throw new Error(`Tool response missing function name. Please include either 'name' or ensure the corresponding tool_call_id exists.`);
        }

        return {
          role: 'user',
          parts: [{
            functionResponse: {
              name: functionName,
              response: JSON.parse(msg.content || '{}'),
            },
          }],
        };
      }

      // Handle assistant messages with tool calls
      if (msg.tool_calls) {
        const parts: any[] = [];

        // Add text content if present
        if (msg.content) {
          parts.push({ text: msg.content });
        }

        // Add function calls
        msg.tool_calls.forEach(tc => {
          parts.push({
            functionCall: {
              name: tc.function.name,
              args: JSON.parse(tc.function.arguments),
            },
          });
        });

        return {
          role: 'model',
          parts,
        };
      }

      // Regular messages
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      };
    });

    return { systemInstruction, contents };
  }

  private normalizeResponse(response: any, model: string): ChatResponse {
    const candidate = response.candidates[0];
    const content = candidate.content;
    const parts = content.parts || [];

    // Extract text and function calls
    const textParts = parts.filter((p: any) => p.text);
    const functionCalls = parts.filter((p: any) => p.functionCall);

    return {
      id: this.generateId(),
      provider: 'gemini',
      model,
      message: {
        role: 'assistant',
        content: textParts.length > 0 ? textParts[0].text : null,
        tool_calls: functionCalls.length > 0 ? fromGeminiResponse(parts) : undefined,
      },
      finish_reason: functionCalls.length > 0 ? 'tool_calls' : this.mapFinishReason(candidate.finishReason),
      usage: response.usageMetadata ? {
        prompt_tokens: response.usageMetadata.promptTokenCount || 0,
        completion_tokens: response.usageMetadata.candidatesTokenCount || 0,
        total_tokens: response.usageMetadata.totalTokenCount || 0,
      } : undefined,
      created_at: new Date(),
    };
  }

  private normalizeStreamChunk(chunk: any, model: string, index: number): StreamChunk {
    const candidate = chunk.candidates?.[0];
    const content = candidate?.content;
    const parts = content?.parts || [];

    // Extract text and function calls
    const textParts = parts.filter((p: any) => p.text);
    const functionCalls = parts.filter((p: any) => p.functionCall);

    return {
      id: `${this.generateId()}-${index}`,
      provider: 'gemini',
      model,
      delta: {
        content: textParts.length > 0 ? textParts[0].text : undefined,
        tool_calls: functionCalls.length > 0
          ? functionCalls.map((fc: any, idx: number) => ({
              index: idx,
              id: `call_${Date.now()}_${idx}`,
              type: 'function' as const,
              function: {
                name: fc.functionCall.name,
                arguments: JSON.stringify(fc.functionCall.args),
              },
            }))
          : undefined,
      },
      finish_reason: candidate?.finishReason ? this.mapFinishReason(candidate.finishReason) : undefined,
    };
  }

  private mapFinishReason(reason: string | undefined): ChatResponse['finish_reason'] {
    switch (reason) {
      case 'STOP':
        return 'stop';
      case 'MAX_TOKENS':
        return 'length';
      case 'SAFETY':
        return 'content_filter';
      default:
        return null;
    }
  }

  private generateId(): string {
    return `gemini-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected handleError(error: any): AIIntegratorError {
    let errorType: ErrorType = 'api_error' as ErrorType;
    let message = error?.message || 'Unknown error occurred';
    let retryable = false;
    let statusCode: number | undefined;

    // Gemini errors are typically GoogleGenerativeAIError instances
    const errorMessage = (error?.message || '').toLowerCase();

    if (errorMessage.includes('api key')) {
      errorType = 'authentication_error' as ErrorType;
      message = 'Invalid API key';
      statusCode = 401;
    } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
      errorType = 'rate_limit_error' as ErrorType;
      message = 'Rate limit exceeded';
      retryable = true;
      statusCode = 429;
    } else if (errorMessage.includes('invalid')) {
      errorType = 'invalid_request_error' as ErrorType;
      statusCode = 400;
    } else if (errorMessage.includes('timeout')) {
      errorType = 'timeout_error' as ErrorType;
      retryable = true;
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      errorType = 'network_error' as ErrorType;
      retryable = true;
    } else {
      // Check for HTTP error codes if available
      statusCode = error?.status || error?.response?.status;
      if (statusCode) {
        if (statusCode >= 500) {
          retryable = true;
        } else if (statusCode === 429) {
          errorType = 'rate_limit_error' as ErrorType;
          retryable = true;
        }
      }
    }

    return new AIError(
      errorType,
      message,
      statusCode,
      'gemini',
      retryable,
      error
    );
  }
}
