import type {
  AIClientConfig,
  ChatRequest,
  ChatResponse,
  StreamChunk,
  IProvider,
  FallbackConfig,
  CustomProviderConfig,
} from './types';
import { AIIntegratorError, ErrorType } from './types';
import { OpenAIProvider } from '../providers/openai';
import { AnthropicProvider } from '../providers/anthropic';
import { GeminiProvider } from '../providers/gemini';
import { retry, retryWithTimeout } from '../utils/retry';
import { Logger } from '../utils/logger';

/**
 * Main AI client with automatic fallback support
 */
export class AIClient {
  private primaryProvider: IProvider;
  private fallbackProviders: IProvider[] = [];
  private logger: Logger;
  private config: AIClientConfig;

  constructor(config: AIClientConfig) {
    this.config = config;
    this.logger = new Logger(config.debug);

    // Initialize primary provider
    this.primaryProvider = this.createProvider(config);

    // Initialize fallback providers
    if (config.fallbacks && config.fallbacks.length > 0) {
      this.fallbackProviders = config.fallbacks
        .sort((a, b) => (a.priority || 0) - (b.priority || 0))
        .map(fallback => this.createProvider(fallback));

      this.logger.info(`Initialized with ${this.fallbackProviders.length} fallback provider(s)`);
    }

    this.logger.info(`Primary provider: ${this.primaryProvider.type}`);
  }

  /**
   * Create a provider instance based on config
   * NOW SUPPORTS CUSTOM PROVIDERS!
   */
  private createProvider(
    config: AIClientConfig | FallbackConfig | CustomProviderConfig
  ): IProvider {
    // Check if custom provider class is provided
    if ('customProvider' in config && config.customProvider) {
      const CustomProviderClass = config.customProvider;
      const instance = new CustomProviderClass(config);

      // Validate that it implements IProvider
      this.validateProvider(instance);

      this.logger.info(`Created custom provider: ${instance.type}`);
      return instance;
    }

    // Built-in providers
    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'gemini':
        return new GeminiProvider(config);
      default:
        throw new Error(
          `Unknown provider: ${config.provider}. ` +
          `Use 'customProvider' option to provide a custom provider implementation.`
        );
    }
  }

  /**
   * Validate that a custom provider implements IProvider
   */
  private validateProvider(provider: unknown): asserts provider is IProvider {
    const p = provider as Partial<IProvider>;

    if (!p || typeof p !== 'object') {
      throw new Error('Custom provider must be an object');
    }

    if (!p.type || typeof p.type !== 'string') {
      throw new Error('Custom provider must have a "type" property');
    }

    if (!p.config || typeof p.config !== 'object') {
      throw new Error('Custom provider must have a "config" property');
    }

    if (typeof p.chat !== 'function') {
      throw new Error('Custom provider must implement chat() method');
    }

    if (typeof p.chatStream !== 'function') {
      throw new Error('Custom provider must implement chatStream() method');
    }

    if (typeof p.isConfigured !== 'function') {
      throw new Error('Custom provider must implement isConfigured() method');
    }
  }

  /**
   * Perform chat completion with automatic fallback
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const providers = [this.primaryProvider, ...this.fallbackProviders];
    let lastError: AIIntegratorError | undefined;

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      const isPrimary = i === 0;

      try {
        this.logger.debug(
          `Attempting chat with ${provider.type} (${isPrimary ? 'primary' : `fallback ${i}`})`
        );

        const execute = () => provider.chat(request);

        const response = this.config.timeout
          ? await retryWithTimeout(execute, this.config.timeout, this.config.retry)
          : await retry(execute, this.config.retry);

        this.logger.info(`Successfully completed chat with ${provider.type}`);
        return response;
      } catch (error) {
        lastError = error instanceof AIIntegratorError
          ? error
          : new AIIntegratorError(
              ErrorType.UNKNOWN,
              error instanceof Error ? error.message : 'Unknown error',
              undefined,
              provider.type,
              false,
              error
            );

        this.logger.warn(
          `${provider.type} failed: ${lastError.message}`,
          { retryable: lastError.retryable, type: lastError.type }
        );

        // If this is the last provider, throw the error
        if (i === providers.length - 1) {
          throw lastError;
        }

        // If error is not retryable and we have fallbacks, try next provider
        if (!lastError.retryable && this.fallbackProviders.length > 0) {
          this.logger.info(`Switching to fallback provider...`);
          continue;
        }

        // If no fallbacks, throw the error
        if (this.fallbackProviders.length === 0) {
          throw lastError;
        }
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new AIIntegratorError(ErrorType.UNKNOWN, 'All providers failed');
  }

  /**
   * Perform streaming chat completion with automatic fallback
   */
  async *chatStream(request: ChatRequest): AsyncGenerator<StreamChunk, void, unknown> {
    const providers = [this.primaryProvider, ...this.fallbackProviders];
    let lastError: AIIntegratorError | undefined;

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      const isPrimary = i === 0;

      try {
        this.logger.debug(
          `Attempting stream with ${provider.type} (${isPrimary ? 'primary' : `fallback ${i}`})`
        );

        yield* provider.chatStream(request);
        this.logger.info(`Successfully completed stream with ${provider.type}`);
        return;
      } catch (error) {
        lastError = error instanceof AIIntegratorError
          ? error
          : new AIIntegratorError(
              ErrorType.UNKNOWN,
              error instanceof Error ? error.message : 'Unknown error',
              undefined,
              provider.type,
              false,
              error
            );

        this.logger.warn(
          `${provider.type} stream failed: ${lastError.message}`,
          { retryable: lastError.retryable, type: lastError.type }
        );

        // If this is the last provider, throw the error
        if (i === providers.length - 1) {
          throw lastError;
        }

        // Try next provider
        this.logger.info(`Switching to fallback provider for streaming...`);
      }
    }

    throw lastError || new AIIntegratorError(ErrorType.UNKNOWN, 'All providers failed');
  }

  /**
   * Get the current primary provider type
   */
  getPrimaryProvider(): string {
    return this.primaryProvider.type;
  }

  /**
   * Get all configured providers
   */
  getProviders(): string[] {
    return [
      this.primaryProvider.type,
      ...this.fallbackProviders.map(p => p.type),
    ];
  }

  /**
   * Check if a specific provider is configured
   */
  hasProvider(provider: string): boolean {
    return this.getProviders().includes(provider);
  }

  /**
   * Enable or disable debug logging
   */
  setDebug(enabled: boolean): void {
    this.logger.setEnabled(enabled);
  }
}
