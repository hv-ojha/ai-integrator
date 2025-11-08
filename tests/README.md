# Test Suite Documentation

Comprehensive test suite for @ai-integrator/core package.

## Overview

The test suite is organized into three main categories:

1. **Unit Tests** - Test individual components in isolation
2. **Integration Tests** - Test components working together
3. **Mocks** - Mock implementations of external dependencies

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- tests/unit/utils/retry.test.ts

# Run tests matching a pattern
npm test -- --grep "OpenAI"
```

## Test Structure

```
tests/
├── setup.ts                    # Global test setup
├── mocks/                      # Mock implementations
│   ├── openai.mock.ts         # OpenAI SDK mock
│   ├── anthropic.mock.ts      # Anthropic SDK mock
│   └── gemini.mock.ts         # Gemini SDK mock
├── unit/                       # Unit tests
│   ├── utils/                 # Utility function tests
│   │   ├── retry.test.ts
│   │   └── logger.test.ts
│   └── providers/             # Provider tests
│       ├── openai.test.ts
│       ├── anthropic.test.ts
│       └── gemini.test.ts
└── integration/                # Integration tests
    └── client.test.ts         # AIClient tests
```

## Test Coverage Goals

- **Lines**: > 80%
- **Functions**: > 80%
- **Branches**: > 80%
- **Statements**: > 80%

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { retry } from '../../../src/utils/retry';

describe('retry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await retry(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { AIClient } from '../../src/core/client';

describe('AIClient', () => {
  it('should successfully complete a chat request', async () => {
    const client = new AIClient({
      provider: 'openai',
      apiKey: 'test-key',
    });

    const response = await client.chat({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Test' }],
    });

    expect(response.message.content).toBeDefined();
  });
});
```

## Test Categories

### 1. Utility Tests

**Location**: `tests/unit/utils/`

Tests for utility functions like retry logic and logging.

**Coverage**:
- ✅ Retry with exponential backoff
- ✅ Retry with timeout
- ✅ Retryable vs non-retryable errors
- ✅ Logger enable/disable
- ✅ Log levels (debug, info, warn, error)

### 2. Provider Tests

**Location**: `tests/unit/providers/`

Tests for individual AI provider implementations.

**Coverage for Each Provider**:
- ✅ Initialization
- ✅ Configuration validation
- ✅ Chat completion
- ✅ Streaming
- ✅ Message format conversion
- ✅ Error handling (auth, rate limit, network, etc.)
- ✅ Parameter passing
- ✅ Response normalization

**Providers Tested**:
- OpenAI (`openai.test.ts`)
- Anthropic (`anthropic.test.ts`)
- Gemini (`gemini.test.ts`)

### 3. Integration Tests

**Location**: `tests/integration/`

Tests for the complete flow including multiple providers and fallback logic.

**Coverage**:
- ✅ Single provider chat
- ✅ Single provider streaming
- ✅ Fallback to secondary provider
- ✅ Fallback through multiple providers
- ✅ Retry logic with primary provider
- ✅ Timeout handling
- ✅ Error propagation
- ✅ Debug mode
- ✅ Client info methods

## Mock Implementations

### OpenAI Mock

```typescript
import { createMockOpenAIResponse, createMockOpenAIError } from '../mocks/openai.mock';

// Create success response
const response = createMockOpenAIResponse('Test content');

// Create error
const error = createMockOpenAIError(429, 'Rate limit exceeded');

// Create stream
const stream = createMockOpenAIStream('Streaming content');
```

### Anthropic Mock

```typescript
import { createMockAnthropicResponse } from '../mocks/anthropic.mock';

const response = createMockAnthropicResponse('Claude response');
```

### Gemini Mock

```typescript
import { createMockGeminiResponse } from '../mocks/gemini.mock';

const response = createMockGeminiResponse('Gemini response');
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm install
      - run: npm test
      - run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Test Best Practices

### 1. Isolation

Each test should be independent and not rely on other tests.

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

### 2. Descriptive Names

Use clear, descriptive test names.

```typescript
// Good
it('should fallback to second provider when first fails', async () => {});

// Bad
it('test fallback', async () => {});
```

### 3. Arrange-Act-Assert

Follow the AAA pattern:

```typescript
it('should retry on retryable errors', async () => {
  // Arrange
  const fn = vi.fn()
    .mockRejectedValueOnce(new Error('Fail'))
    .mockResolvedValue('Success');

  // Act
  const result = await retry(fn);

  // Assert
  expect(result).toBe('Success');
  expect(fn).toHaveBeenCalledTimes(2);
});
```

### 4. Test Both Success and Failure Cases

```typescript
describe('chat', () => {
  it('should succeed with valid input', async () => {
    // Test success case
  });

  it('should throw error with invalid input', async () => {
    // Test failure case
  });
});
```

### 5. Mock External Dependencies

Always mock external APIs and SDKs:

```typescript
vi.mock('openai', () => ({
  default: class MockOpenAI {
    // Mock implementation
  },
}));
```

## Debugging Tests

### Run Single Test

```bash
npm test -- tests/unit/utils/retry.test.ts
```

### Run with Verbose Output

```bash
npm test -- --reporter=verbose
```

### Run in Watch Mode

```bash
npm run test:watch
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["test"],
  "console": "integratedTerminal"
}
```

## Coverage Reports

After running `npm run test:coverage`, reports are generated in:

- **HTML**: `coverage/index.html` (Open in browser)
- **LCOV**: `coverage/lcov.info` (For CI tools)
- **JSON**: `coverage/coverage-final.json`
- **Text**: Displayed in console

### Viewing HTML Coverage

```bash
npm run test:coverage
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

## Test Scenarios Covered

### ✅ Happy Path
- Successful chat completions
- Successful streaming
- Multiple message turns
- All providers working correctly

### ✅ Error Handling
- Authentication errors (401)
- Rate limiting (429)
- Invalid requests (400)
- Server errors (500+)
- Network errors
- Timeout errors

### ✅ Fallback Logic
- Primary provider fails, fallback succeeds
- Multiple fallbacks in sequence
- All providers fail
- Non-retryable errors trigger fallback

### ✅ Retry Logic
- Retryable errors trigger retry
- Non-retryable errors skip retry
- Max retries respected
- Exponential backoff working
- Timeout during retry

### ✅ Edge Cases
- Empty messages array
- Missing model
- Invalid temperature
- System message handling
- Multiple system messages
- Function messages
- Large content

### ✅ Configuration
- Provider switching
- Debug mode
- Timeout settings
- Retry configuration
- Custom base URLs

## Continuous Improvement

### Adding New Tests

1. Create test file in appropriate directory
2. Follow naming convention: `*.test.ts`
3. Import required utilities from vitest
4. Write tests following best practices
5. Run tests to verify
6. Check coverage impact

### Updating Mocks

When provider SDKs update:

1. Update mock implementations in `tests/mocks/`
2. Update test expectations if needed
3. Run full test suite
4. Update this documentation

## Troubleshooting

### Tests Failing Locally

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear cache
npm cache clean --force

# Run tests
npm test
```

### Mock Not Working

Ensure mocks are defined before imports:

```typescript
vi.mock('openai', () => ({
  // Mock implementation
}));

// Then import
import { OpenAIProvider } from '../../../src/providers/openai';
```

### Coverage Not Generated

```bash
# Install coverage provider
npm install -D @vitest/coverage-v8

# Run with coverage
npm run test:coverage
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Test Coverage Best Practices](https://martinfowler.com/bliki/TestCoverage.html)

## Maintenance

- Review and update tests when adding features
- Keep coverage above 80%
- Update mocks when provider APIs change
- Document new test patterns
- Review and refactor flaky tests

---

**Last Updated**: 2025-01-07
**Test Framework**: Vitest
**Coverage Tool**: v8
**Total Tests**: 100+
