/**
 * @ai-integrator/core
 *
 * The lightest AI integration library with zero-config switching
 * between OpenAI, Anthropic, and Google Gemini.
 * Optimized for edge runtimes.
 */

// Core exports
export { AIClient } from './core/client';
export type {
  AIClientConfig,
  ChatRequest,
  ChatResponse,
  StreamChunk,
  Message,
  MessageRole,
  FunctionDefinition,
  Usage,
  ProviderType,
  BuiltInProviderType,
  ProviderConfig,
  FallbackConfig,
  CustomProviderConfig,
  RetryConfig,
  ErrorType,
  IProvider,
  // Tool calling types (v0.2.0)
  ToolDefinition,
  ToolCall,
  ToolChoice,
  ToolParameterSchema,
} from './core/types';
export { AIIntegratorError } from './core/types';

// Provider exports (for advanced usage)
export { OpenAIProvider, AnthropicProvider, GeminiProvider } from './providers';
export { BaseProvider } from './providers/base';

// Utility exports (for advanced usage)
export { retry, retryWithTimeout } from './utils';
