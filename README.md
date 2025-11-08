# @ai-integrator/core

> The lightest AI integration library with zero-config switching between OpenAI, Anthropic, and Google Gemini. Optimized for edge runtimes.

[![npm version](https://badge.fury.io/js/@ai-integrator%2Fcore.svg)](https://www.npmjs.com/package/@ai-integrator/core)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why @ai-integrator/core?

- **🪶 Lightweight**: Minimal dependencies, tree-shakable, <10KB gzipped
- **⚡ Zero-config**: Switch providers with a single parameter
- **🌐 Edge-ready**: Works on Cloudflare Workers, Vercel Edge, Deno, Node.js
- **🔄 Auto-fallback**: Automatic provider switching when APIs fail
- **📡 Streaming**: First-class streaming support across all providers
- **🔒 Type-safe**: Full TypeScript support with comprehensive types
- **🎯 Simple API**: Unified interface across OpenAI, Anthropic, and Gemini

## Installation

```bash
npm install @ai-integrator/core
```

Then install the provider SDKs you need:

```bash
# OpenAI
npm install openai

# Anthropic (Claude)
npm install @anthropic-ai/sdk

# Google Gemini
npm install @google/generative-ai
```

> **Note**: Provider SDKs are peer dependencies, so you only install what you use.

## Quick Start

### Basic Usage

```typescript
import { AIClient } from '@ai-integrator/core';

const client = new AIClient({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await client.chat({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'user', content: 'What is the capital of France?' }
  ],
});

console.log(response.message.content);
// Output: "The capital of France is Paris."
```

### Switch Providers

```typescript
// Use Anthropic instead
const client = new AIClient({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const response = await client.chat({
  model: 'claude-3-5-sonnet-20241022',
  messages: [
    { role: 'user', content: 'Explain quantum computing' }
  ],
});

// Or use Gemini
const client = new AIClient({
  provider: 'gemini',
  apiKey: process.env.GEMINI_API_KEY,
});

const response = await client.chat({
  model: 'gemini-1.5-flash',
  messages: [
    { role: 'user', content: 'Write a haiku about code' }
  ],
});
```

## Streaming

```typescript
const stream = client.chatStream({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'user', content: 'Write a short story about a robot' }
  ],
});

for await (const chunk of stream) {
  process.stdout.write(chunk.delta.content || '');
}
```

## Automatic Fallback

Configure fallback providers for high availability:

```typescript
const client = new AIClient({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  fallbacks: [
    {
      provider: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY,
      priority: 1, // Lower = higher priority
    },
    {
      provider: 'gemini',
      apiKey: process.env.GEMINI_API_KEY,
      priority: 2,
    },
  ],
});

// If OpenAI fails, automatically tries Anthropic, then Gemini
const response = await client.chat({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

## Advanced Configuration

### Retry Logic

```typescript
const client = new AIClient({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  retry: {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 60000, // 60 seconds
    backoffMultiplier: 2, // Exponential backoff
  },
  timeout: 30000, // 30 seconds
});
```

### Debug Mode

```typescript
const client = new AIClient({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  debug: true, // Enables detailed logging
});
```

### System Messages

```typescript
const response = await client.chat({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: 'You are a helpful coding assistant' },
    { role: 'user', content: 'How do I center a div?' },
  ],
});
```

### Temperature & Other Options

```typescript
const response = await client.chat({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'Be creative!' }],
  temperature: 1.5,
  max_tokens: 500,
  top_p: 0.9,
  stop: ['\n\n', 'END'],
});
```

## Edge Runtime Examples

### Cloudflare Workers

```typescript
export default {
  async fetch(request: Request, env: Env) {
    const client = new AIClient({
      provider: 'openai',
      apiKey: env.OPENAI_API_KEY,
    });

    const response = await client.chat({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Hello from the edge!' }],
    });

    return new Response(response.message.content);
  },
};
```

### Vercel Edge Functions

```typescript
import { AIClient } from '@ai-integrator/core';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const client = new AIClient({
    provider: 'anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const stream = client.chatStream({
    model: 'claude-3-5-sonnet-20241022',
    messages: [{ role: 'user', content: 'Stream me a story' }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        controller.enqueue(encoder.encode(chunk.delta.content || ''));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
```

### Deno

```typescript
import { AIClient } from 'npm:@ai-integrator/core';

const client = new AIClient({
  provider: 'gemini',
  apiKey: Deno.env.get('GEMINI_API_KEY')!,
});

const response = await client.chat({
  model: 'gemini-1.5-flash',
  messages: [{ role: 'user', content: 'Hello from Deno!' }],
});

console.log(response.message.content);
```

## API Reference

### `AIClient`

Main client class for interacting with AI providers.

#### Constructor

```typescript
new AIClient(config: AIClientConfig)
```

**AIClientConfig:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `provider` | `'openai' \| 'anthropic' \| 'gemini'` | Yes | Primary AI provider |
| `apiKey` | `string` | Yes | API key for the provider |
| `baseURL` | `string` | No | Custom API endpoint |
| `organization` | `string` | No | Organization ID (OpenAI only) |
| `defaultModel` | `string` | No | Default model to use |
| `fallbacks` | `FallbackConfig[]` | No | Fallback providers |
| `retry` | `RetryConfig` | No | Retry configuration |
| `timeout` | `number` | No | Request timeout in ms |
| `debug` | `boolean` | No | Enable debug logging |

#### Methods

##### `chat(request: ChatRequest): Promise<ChatResponse>`

Perform a chat completion.

**ChatRequest:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `model` | `string` | Yes | Model identifier |
| `messages` | `Message[]` | Yes | Conversation messages |
| `temperature` | `number` | No | Sampling temperature (0-2) |
| `max_tokens` | `number` | No | Maximum tokens to generate |
| `top_p` | `number` | No | Nucleus sampling parameter |
| `stop` | `string \| string[]` | No | Stop sequences |
| `stream` | `boolean` | No | Enable streaming |

##### `chatStream(request: ChatRequest): AsyncGenerator<StreamChunk>`

Perform a streaming chat completion.

##### `getPrimaryProvider(): string`

Get the current primary provider type.

##### `getProviders(): string[]`

Get all configured providers.

##### `setDebug(enabled: boolean): void`

Enable or disable debug logging.

## Feature Comparison

| Feature | OpenAI | Anthropic | Gemini | @ai-integrator/core |
|---------|--------|-----------|--------|---------------------|
| Unified API | ❌ | ❌ | ❌ | ✅ |
| Auto-fallback | ❌ | ❌ | ❌ | ✅ |
| Edge-ready | ⚠️ | ⚠️ | ⚠️ | ✅ |
| Zero-config switching | ❌ | ❌ | ❌ | ✅ |
| Built-in retry | ❌ | ❌ | ❌ | ✅ |
| Streaming | ✅ | ✅ | ✅ | ✅ |
| TypeScript | ✅ | ✅ | ✅ | ✅ |

## Comparison with Other Libraries

### vs. Vercel AI SDK

- **@ai-integrator/core**: Lightweight, focused on provider switching, edge-first
- **Vercel AI SDK**: Comprehensive, UI-focused, more opinionated

### vs. LangChain

- **@ai-integrator/core**: Minimal, simple API, <10KB
- **LangChain**: Full-featured framework, chains, agents, memory, larger bundle

### vs. LiteLLM

- **@ai-integrator/core**: Zero infrastructure, edge-compatible, npm package
- **LiteLLM**: Self-hosted proxy, Python-first, more enterprise features

## Default Models

| Provider | Default Model |
|----------|---------------|
| OpenAI | `gpt-4o-mini` |
| Anthropic | `claude-3-5-sonnet-20241022` |
| Gemini | `gemini-1.5-flash` |

## Error Handling

```typescript
import { AIIntegratorError } from '@ai-integrator/core';

try {
  const response = await client.chat({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Hello!' }],
  });
} catch (error) {
  if (error instanceof AIIntegratorError) {
    console.error('Error type:', error.type);
    console.error('Provider:', error.provider);
    console.error('Status code:', error.statusCode);
    console.error('Retryable:', error.retryable);
  }
}
```

**Error Types:**

- `authentication_error`: Invalid API key
- `rate_limit_error`: Rate limit exceeded
- `invalid_request_error`: Invalid request parameters
- `api_error`: API error from provider
- `timeout_error`: Request timeout
- `network_error`: Network connectivity issue
- `unknown_error`: Unknown error

## Bundle Size

| Package | Minified + Gzipped |
|---------|-------------------|
| @ai-integrator/core | ~8KB |
| Vercel AI SDK | ~50KB |
| LangChain | ~200KB+ |

## Best Practices

1. **Use environment variables** for API keys
2. **Enable fallbacks** for production applications
3. **Configure timeouts** appropriate for your use case
4. **Use streaming** for better UX in chat applications
5. **Handle errors** gracefully with try-catch
6. **Set appropriate temperature** based on use case (lower for factual, higher for creative)

## Requirements

- Node.js 18+
- TypeScript 5+ (for type support)

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

- [GitHub Issues](https://github.com/yourusername/ai-integrator/issues)
- [Documentation](https://github.com/yourusername/ai-integrator#readme)

## Roadmap

- [ ] Support for more providers (Cohere, Mistral, etc.)
- [ ] Function/tool calling support
- [ ] Vision support for multimodal models
- [ ] Caching layer
- [ ] Observability hooks
- [ ] Admin dashboard

---

Made with ❤️ for developers who want simple AI integration
