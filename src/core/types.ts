/**
 * Supported AI providers
 */
export type ProviderType = 'openai' | 'anthropic' | 'gemini';

/**
 * Message role in a conversation
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'function';

/**
 * Unified message format across all providers
 */
export interface Message {
  role: MessageRole;
  content: string;
  name?: string; // For function messages
  function_call?: {
    name: string;
    arguments: string;
  };
}

/**
 * Function/tool definition for function calling
 */
export interface FunctionDefinition {
  name: string;
  description?: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Unified request options for chat completion
 */
export interface ChatRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
  functions?: FunctionDefinition[];
  function_call?: 'none' | 'auto' | { name: string };
  stream?: boolean;
}

/**
 * Usage information for API calls
 */
export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/**
 * Unified response format for chat completion
 */
export interface ChatResponse {
  id: string;
  provider: ProviderType;
  model: string;
  message: Message;
  finish_reason: 'stop' | 'length' | 'function_call' | 'content_filter' | null;
  usage?: Usage;
  created_at: Date;
}

/**
 * Streaming chunk for real-time responses
 */
export interface StreamChunk {
  id: string;
  provider: ProviderType;
  model: string;
  delta: {
    role?: MessageRole;
    content?: string;
    function_call?: {
      name?: string;
      arguments?: string;
    };
  };
  finish_reason?: 'stop' | 'length' | 'function_call' | 'content_filter' | null;
}

/**
 * Provider-specific configuration
 */
export interface ProviderConfig {
  provider: ProviderType;
  apiKey: string;
  baseURL?: string; // For custom endpoints
  organization?: string; // For OpenAI
  defaultModel?: string;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number; // in milliseconds
  maxDelay: number; // in milliseconds
  backoffMultiplier: number;
}

/**
 * Fallback configuration
 */
export interface FallbackConfig extends ProviderConfig {
  priority?: number; // Lower number = higher priority
}

/**
 * Main client configuration
 */
export interface AIClientConfig extends ProviderConfig {
  fallbacks?: FallbackConfig[];
  retry?: Partial<RetryConfig>;
  timeout?: number; // in milliseconds
  debug?: boolean;
}

/**
 * Error types
 */
export enum ErrorType {
  AUTHENTICATION = 'authentication_error',
  RATE_LIMIT = 'rate_limit_error',
  INVALID_REQUEST = 'invalid_request_error',
  API_ERROR = 'api_error',
  TIMEOUT = 'timeout_error',
  NETWORK = 'network_error',
  UNKNOWN = 'unknown_error'
}

/**
 * Unified error class
 */
export class AIIntegratorError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public statusCode?: number,
    public provider?: ProviderType,
    public retryable: boolean = false,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AIIntegratorError';
    Object.setPrototypeOf(this, AIIntegratorError.prototype);
  }
}

/**
 * Provider interface that all providers must implement
 */
export interface IProvider {
  readonly type: ProviderType;
  readonly config: ProviderConfig;

  chat(request: ChatRequest): Promise<ChatResponse>;
  chatStream(request: ChatRequest): AsyncGenerator<StreamChunk, void, unknown>;
  isConfigured(): boolean;
}
