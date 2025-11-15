import type {
  IProvider,
  ProviderType,
  ProviderConfig,
  ChatRequest,
  ChatResponse,
  StreamChunk,
  AIIntegratorError
} from '../core/types';

/**
 * Abstract base class for all AI providers
 * Implements common functionality and enforces interface
 */
export abstract class BaseProvider implements IProvider {
  abstract readonly type: ProviderType;
  readonly config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.validateApiKey(config);
    this.config = config;
  }

  /**
   * Validate that API key is provided
   */
  private validateApiKey(config: ProviderConfig): void {
    if (!config.apiKey || config.apiKey.trim() === '') {
      throw new Error('API key is required but was not provided');
    }
  }

  /**
   * Check if the provider is properly configured
   */
  isConfigured(): boolean {
    return Boolean(this.config.apiKey);
  }

  /**
   * Perform chat completion
   */
  abstract chat(request: ChatRequest): Promise<ChatResponse>;

  /**
   * Perform streaming chat completion
   */
  abstract chatStream(request: ChatRequest): AsyncGenerator<StreamChunk, void, unknown>;

  /**
   * Validate request before sending to provider
   */
  protected validateRequest(request: ChatRequest): void {
    if (!request.messages || request.messages.length === 0) {
      throw new Error('Messages array cannot be empty');
    }

    // Model is optional - will use default if not provided
    // Validation removed to allow empty model strings

    if (request.temperature !== undefined && (request.temperature < 0 || request.temperature > 2)) {
      throw new Error('Temperature must be between 0 and 2');
    }

    if (request.max_tokens !== undefined && request.max_tokens < 1) {
      throw new Error('max_tokens must be greater than 0');
    }

    // DEPRECATION WARNINGS (only in debug mode)
    if (this.config.debug) {
      if (request.functions) {
        console.warn(
          `[@ai-integrator/core] DEPRECATION WARNING: The 'functions' parameter is deprecated. ` +
          `Please use 'tools' instead for better parallel execution support. ` +
          `Migration guide: https://github.com/hv-ojha/ai-integrator#migration-guide ` +
          `This parameter will be removed in v1.0.0.`
        );
      }

      if (request.function_call) {
        console.warn(
          `[@ai-integrator/core] DEPRECATION WARNING: The 'function_call' parameter is deprecated. ` +
          `Please use 'tool_choice' instead. ` +
          `This parameter will be removed in v1.0.0.`
        );
      }
    }
  }

  /**
   * Get default model for this provider
   */
  protected getDefaultModel(): string {
    return this.config.defaultModel || this.getProviderDefaultModel();
  }

  /**
   * Get provider-specific default model
   */
  protected abstract getProviderDefaultModel(): string;

  /**
   * Handle errors from the provider API
   */
  protected abstract handleError(error: unknown): AIIntegratorError;
}
