# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-07

### Added

- Initial release of @ai-integrator/core
- Support for OpenAI, Anthropic (Claude), and Google Gemini providers
- Unified API for chat completions across all providers
- Streaming support with AsyncGenerator interface
- Automatic fallback between providers
- Retry logic with exponential backoff
- TypeScript support with comprehensive type definitions
- Edge runtime compatibility (Cloudflare Workers, Vercel Edge, Deno)
- Debug logging mode
- Error handling with unified error types
- Usage tracking and token counting
- Configurable timeouts and retry policies
- Zero-config provider switching
- Tree-shakable and minimal bundle size (~8KB gzipped)

### Features

- **Providers**: OpenAI, Anthropic, Gemini
- **Operations**: Chat completion, Streaming chat
- **Fallback**: Automatic provider switching on failure
- **Retry**: Exponential backoff with configurable policies
- **Types**: Full TypeScript support
- **Edge**: Compatible with edge runtimes
- **Bundle**: Optimized for minimal size

### Documentation

- Comprehensive README with usage examples
- API reference documentation
- Examples for different runtimes
- Migration guides from other libraries
- Best practices guide

## [Unreleased]

### Planned

- Function/tool calling support
- Vision/multimodal support
- Caching layer for responses
- More provider integrations (Cohere, Mistral)
- Observability hooks and metrics
- Admin dashboard for monitoring
- Rate limiting utilities
- Cost tracking and optimization
