# Testing Guide

Complete guide for testing @ai-integrator/core package.

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Interactive UI
npm run test:ui
```

## Test Statistics

- **Total Test Files**: 9
- **Total Test Cases**: 100+
- **Coverage Target**: 80%+
- **Test Framework**: Vitest
- **Mocking**: Vitest mocks

## Test Organization

### Unit Tests (7 files)

#### Utilities (2 files)
- `tests/unit/utils/retry.test.ts` - Retry logic tests
- `tests/unit/utils/logger.test.ts` - Logger tests

#### Providers (3 files)
- `tests/unit/providers/openai.test.ts` - OpenAI provider tests
- `tests/unit/providers/anthropic.test.ts` - Anthropic provider tests
- `tests/unit/providers/gemini.test.ts` - Gemini provider tests

### Integration Tests (1 file)
- `tests/integration/client.test.ts` - AIClient with fallback tests

### Mocks (3 files)
- `tests/mocks/openai.mock.ts` - OpenAI SDK mock
- `tests/mocks/anthropic.mock.ts` - Anthropic SDK mock
- `tests/mocks/gemini.mock.ts` - Gemini SDK mock

## Test Coverage by Feature

### ✅ Retry Logic
- Exponential backoff
- Max retries
- Timeout handling
- Retryable vs non-retryable errors
- Custom retry predicates

### ✅ Logger
- Enable/disable
- Log levels
- Prefix formatting
- Multiple arguments

### ✅ Providers
**Each provider tests**:
- Initialization and configuration
- Chat completions
- Streaming
- Message format conversion
- System message handling
- Parameter passing
- Error handling (auth, rate limit, network, timeout)
- Response normalization

### ✅ AIClient
- Single provider operations
- Fallback logic (2-3 providers)
- Retry with fallback
- Streaming with fallback
- Timeout handling
- Debug mode
- Provider info methods

### ✅ Error Handling
- Authentication errors (401)
- Rate limit errors (429)
- Invalid requests (400)
- Server errors (500+)
- Network errors
- Timeout errors
- Error classification (retryable vs non-retryable)

## Running Specific Tests

```bash
# Run single file
npm test tests/unit/utils/retry.test.ts

# Run tests matching pattern
npm test -- --grep "fallback"

# Run only unit tests
npm test tests/unit

# Run only integration tests
npm test tests/integration
```

## Coverage Reports

### Generate Coverage

```bash
npm run test:coverage
```

### View HTML Report

```bash
# macOS
open coverage/index.html

# Linux
xdg-open coverage/index.html

# Windows
start coverage/index.html
```

### Coverage Thresholds

Configured in `vitest.config.ts`:

```typescript
coverage: {
  lines: 80,
  functions: 80,
  branches: 80,
  statements: 80,
}
```

## Writing New Tests

### Test Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { YourModule } from '../../../src/your-module';

describe('YourModule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('feature name', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = YourModule.doSomething(input);

      // Assert
      expect(result).toBe('expected');
    });

    it('should handle errors gracefully', () => {
      expect(() => {
        YourModule.doSomething(null);
      }).toThrow('Expected error message');
    });
  });
});
```

### Async Test Template

```typescript
it('should handle async operations', async () => {
  const mockFn = vi.fn().mockResolvedValue('result');

  const result = await mockFn();

  expect(result).toBe('result');
  expect(mockFn).toHaveBeenCalledTimes(1);
});
```

### Stream Test Template

```typescript
it('should stream data correctly', async () => {
  async function* mockStream() {
    yield 'chunk1';
    yield 'chunk2';
  }

  const chunks: string[] = [];
  for await (const chunk of mockStream()) {
    chunks.push(chunk);
  }

  expect(chunks).toEqual(['chunk1', 'chunk2']);
});
```

## Debugging Tests

### VS Code Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Current Test",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["test", "--", "${file}"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Debug Single Test

```bash
# Add --inspect flag
node --inspect-brk ./node_modules/.bin/vitest run tests/unit/utils/retry.test.ts
```

### Enable Verbose Output

```bash
npm test -- --reporter=verbose
```

## CI/CD Integration

Tests run automatically on:
- Push to `master` or `develop` branches
- Pull requests to `master` or `develop`

### GitHub Actions Workflow

Location: `.github/workflows/test.yml`

**Steps**:
1. Checkout code
2. Setup Node.js (18.x, 20.x, 21.x)
3. Install dependencies
4. Run type check
5. Run linter
6. Run tests
7. Generate coverage
8. Upload to Codecov

### Local Validation

Run the same checks as CI:

```bash
npm run validate
```

This runs:
- Type checking
- Linting
- All tests

## Common Issues

### Issue: Tests Timeout

**Solution**: Increase timeout in test file

```typescript
it('long running test', async () => {
  // Test code
}, 10000); // 10 second timeout
```

### Issue: Mocks Not Working

**Solution**: Ensure mocks are hoisted

```typescript
vi.mock('module-name', () => ({
  // Mock before imports
}));
```

### Issue: Coverage Not Generated

**Solution**: Install coverage provider

```bash
npm install -D @vitest/coverage-v8
```

### Issue: Flaky Tests

**Solution**: Clear mocks and state

```typescript
beforeEach(() => {
  vi.clearAllMocks();
  vi.clearAllTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

## Best Practices

### ✅ DO

- Write tests for new features
- Test both success and failure cases
- Use descriptive test names
- Clear mocks between tests
- Test edge cases
- Keep tests independent
- Use AAA pattern (Arrange-Act-Assert)

### ❌ DON'T

- Skip tests without good reason
- Write dependent tests
- Test implementation details
- Use real API calls
- Leave console.log in tests
- Ignore failing tests

## Performance

### Test Execution Time

- **Unit Tests**: ~2-3 seconds
- **Integration Tests**: ~3-5 seconds
- **Total**: ~5-8 seconds

### Optimization Tips

1. **Parallel Execution**: Vitest runs tests in parallel by default
2. **Mock External Calls**: Always mock API calls
3. **Avoid Real Timers**: Use `vi.useFakeTimers()` when testing delays
4. **Minimal Setup**: Only set up what's needed for each test

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Test Coverage Guide](https://martinfowler.com/bliki/TestCoverage.html)

## Maintenance Checklist

- [ ] All tests pass locally
- [ ] Coverage above 80%
- [ ] No skipped tests
- [ ] CI pipeline green
- [ ] New features have tests
- [ ] Mocks up to date
- [ ] Documentation updated

---

**Test Framework**: Vitest v1.2.0
**Coverage Provider**: v8
**Node Version**: 18+
**Last Updated**: 2025-01-07
