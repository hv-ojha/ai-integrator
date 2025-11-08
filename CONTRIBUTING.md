# Contributing to @ai-integrator/core

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git

### Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/ai-integrator.git
   cd ai-integrator
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file with your API keys (optional, for testing):
   ```bash
   OPENAI_API_KEY=your-key
   ANTHROPIC_API_KEY=your-key
   GEMINI_API_KEY=your-key
   ```

## Development Workflow

### Running in Development Mode

```bash
npm run dev
```

This watches for changes and rebuilds automatically.

### Building

```bash
npm run build
```

Builds the package to the `dist` directory.

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

### Running Tests

```bash
npm test
```

## Project Structure

```
src/
├── core/          # Core types and main client
├── providers/     # Provider implementations
├── utils/         # Utility functions
└── index.ts       # Public API exports

examples/          # Usage examples
```

## Adding a New Provider

To add support for a new AI provider:

1. Create a new file in `src/providers/` (e.g., `cohere.ts`)

2. Implement the `BaseProvider` abstract class:

```typescript
import { BaseProvider } from './base';
import type { ProviderConfig, ChatRequest, ChatResponse, StreamChunk } from '../core/types';

export class CohereProvider extends BaseProvider {
  readonly type = 'cohere' as const;

  protected getProviderDefaultModel(): string {
    return 'command';
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    // Implementation
  }

  async *chatStream(request: ChatRequest): AsyncGenerator<StreamChunk> {
    // Implementation
  }

  protected handleError(error: any): AIIntegratorError {
    // Error handling
  }
}
```

3. Add the provider to `src/core/types.ts`:

```typescript
export type ProviderType = 'openai' | 'anthropic' | 'gemini' | 'cohere';
```

4. Update the client factory in `src/core/client.ts`:

```typescript
case 'cohere':
  return new CohereProvider(config);
```

5. Export from `src/providers/index.ts`

6. Add tests and documentation

## Pull Request Process

1. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit with clear messages:
   ```bash
   git commit -m "feat: add support for Cohere provider"
   ```

3. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Open a Pull Request on GitHub

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### PR Checklist

- [ ] Code follows the project's style guidelines
- [ ] TypeScript types are properly defined
- [ ] Tests pass
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated
- [ ] Commit messages follow conventional commits

## Code Style

- Use TypeScript
- Follow existing code patterns
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Handle errors properly

## Testing

- Write tests for new features
- Ensure existing tests pass
- Test edge cases
- Test error handling

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for public APIs
- Include code examples where appropriate
- Update CHANGELOG.md

## Questions?

Feel free to open an issue for:
- Bug reports
- Feature requests
- Questions about the codebase
- Documentation improvements

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
