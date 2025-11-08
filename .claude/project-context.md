# Project Context: @ai-integrator/core

## Product Vision
A lightweight, zero-config AI integration library that provides a unified interface for switching between OpenAI, Anthropic (Claude), and Google Gemini. Built for developers who want simplicity, edge runtime compatibility, and provider flexibility.

## Architecture Overview

### Tech Stack
- **Language**: TypeScript 5.7+
- **Build**: tsup (optimized for tree-shaking, dual ESM/CJS output)
- **Testing**: Vitest 2.1.8 with coverage
- **Linting**: ESLint with TypeScript parser
- **Target**: ES2022, Node.js 18+, Edge runtimes

### Folder Structure
```
src/
├── core/
│   ├── types.ts          # Unified type definitions
│   ├── client.ts         # Main AIClient with fallback logic
│   └── index.ts          # Core exports
├── providers/
│   ├── base.ts           # Abstract base provider
│   ├── openai.ts         # OpenAI implementation
│   ├── anthropic.ts      # Anthropic implementation
│   ├── gemini.ts         # Google Gemini implementation
│   └── index.ts          # Provider exports
├── utils/
│   ├── retry.ts          # Retry with exponential backoff
│   ├── logger.ts         # Debug logging
│   └── index.ts          # Utility exports
└── index.ts              # Public API
```

## Current Status (v0.1.0)

### ✅ Completed (Phase 1)
- Core AIClient with unified API
- OpenAI, Anthropic, Gemini provider implementations
- Streaming support across all providers
- Automatic fallback with priority system
- Retry logic with exponential backoff
- Error handling and normalization
- Debug logging
- TypeScript definitions
- Comprehensive documentation
- Test infrastructure (100+ tests)
- Build system (~14KB gzipped)

### 🎯 Next Phase (Phase 2)
- Function/tool calling support
- Vision/multimodal support
- Middleware system
- Enhanced rate limiting
- Usage tracking dashboard
- Improved test coverage (>80%)

## Code Standards
- Refer to senior-engineer.md for implementation patterns
- Refer to lead-engineer.md for review criteria
- Refer to product-manager.md for feature priorities
- Refer to tech-writer.md for documentation guidelines

## Critical Rules

### Performance
- Bundle size MUST stay under 20KB gzipped
- Edge runtime compatibility is NON-NEGOTIABLE
- Tree-shaking MUST be maintained
- Provider SDKs stay as peer dependencies

### Code Quality
- Full TypeScript strict mode
- No `any` types without explicit justification
- All public APIs must have JSDoc comments
- Test coverage target: >80%

### Architecture
- Provider abstraction MUST be maintained
- No provider-specific logic in core/client.ts
- All provider APIs normalize to unified types
- Streaming must work across all providers

### Dependencies
- Minimize dependencies (currently minimal)
- Peer dependencies for provider SDKs only
- Always check bundle size impact before adding deps
- No Node.js-specific dependencies (edge compatibility)