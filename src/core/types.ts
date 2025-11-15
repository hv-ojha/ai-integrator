/**
 * Built-in provider types
 */
export type BuiltInProviderType = 'openai' | 'anthropic' | 'gemini';

/**
 * Supported AI providers (includes custom providers)
 */
export type ProviderType = BuiltInProviderType | string;

/**
 * Message role in a conversation
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'function' | 'tool';

/**
 * Tool/Function parameter schema (JSON Schema subset)
 * Supports the common subset across OpenAI, Anthropic, and Gemini
 */
export interface ToolParameterSchema {
  type: 'object' | 'string' | 'number' | 'boolean' | 'array';
  description?: string;
  properties?: Record<string, ToolParameterSchema>;
  items?: ToolParameterSchema;
  required?: string[];
  enum?: (string | number)[];
  nullable?: boolean;
  format?: string;
}

/**
 * Tool call from the model
 */
export interface ToolCall {
  id: string; // Unique identifier
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

/**
 * Modern tool definition (replaces FunctionDefinition)
 * Unified format across OpenAI, Anthropic, and Gemini
 */
export interface ToolDefinition {
  type?: 'function'; // OpenAI requires this, others ignore
  function: {
    name: string;
    description?: string;
    parameters: ToolParameterSchema;
  };
}

/**
 * Tool choice configuration
 */
export type ToolChoice =
  | 'none'     // Disable tools
  | 'auto'     // Model decides
  | 'required' // Force tool use (OpenAI only)
  | { type: 'function'; function: { name: string } }; // Specific tool

/**
 * Unified message format across all providers
 */
export interface Message {
  role: MessageRole;
  content: string | null; // null when tool_calls exist
  name?: string; // For function/tool messages

  /**
   * @deprecated Use `tool_calls` instead. Will be removed in v1.0.0
   */
  function_call?: {
    name: string;
    arguments: string;
  };

  // MODERN: Tool calling support
  tool_calls?: ToolCall[];
  tool_call_id?: string; // For tool response messages
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
  stream?: boolean;

  /**
   * @deprecated Use `tools` instead. The `functions` parameter is deprecated
   * in favor of the more flexible `tools` API which supports parallel execution.
   * This will be removed in v1.0.0.
   */
  functions?: FunctionDefinition[];

  /**
   * @deprecated Use `tool_choice` instead. This will be removed in v1.0.0.
   */
  function_call?: 'none' | 'auto' | { name: string };

  /**
   * Modern tool calling API. Supports parallel tool execution.
   * Replaces the deprecated `functions` parameter.
   */
  tools?: ToolDefinition[];

  /**
   * Controls which tool the model should call.
   * - `'none'`: Disable tools
   * - `'auto'`: Model decides (default)
   * - `'required'`: Force tool use (OpenAI only)
   * - `{ type: 'function', function: { name: 'foo' } }`: Force specific tool
   */
  tool_choice?: ToolChoice;

  /**
   * Enable parallel tool calls (OpenAI only, default: true)
   */
  parallel_tool_calls?: boolean;
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
  finish_reason: 'stop' | 'length' | 'function_call' | 'tool_calls' | 'content_filter' | null;
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
    content?: string | null;

    /**
     * @deprecated Use `tool_calls` instead. Will be removed in v1.0.0
     */
    function_call?: {
      name?: string;
      arguments?: string;
    };

    // MODERN: Tool calling support
    tool_calls?: Array<{
      index: number;
      id?: string;
      type?: 'function';
      function?: {
        name?: string;
        arguments?: string;
      };
    }>;
  };
  finish_reason?: 'stop' | 'length' | 'function_call' | 'tool_calls' | 'content_filter' | null;
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
  debug?: boolean; // Enable debug logging
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
  customProvider?: new (config: ProviderConfig) => IProvider;
}

/**
 * Configuration for custom providers
 */
export interface CustomProviderConfig extends ProviderConfig {
  provider: string; // Custom identifier
  customProvider: new (config: ProviderConfig) => IProvider;
  priority?: number; // For fallback ordering
}

/**
 * Main client configuration
 */
export interface AIClientConfig extends ProviderConfig {
  customProvider?: new (config: ProviderConfig) => IProvider;
  fallbacks?: (FallbackConfig | CustomProviderConfig)[];
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
