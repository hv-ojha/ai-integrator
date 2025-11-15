import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'examples/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'vitest.config.ts',
        'tsup.config.ts',
      ],
      include: ['src/**/*.ts'],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
    setupFiles: ['./tests/setup.ts'],
  },
});
