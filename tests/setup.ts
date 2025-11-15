/**
 * Test setup file
 * Runs before all tests
 */

import { vi } from 'vitest';

// Set test environment variables
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  debug: vi.fn(),
  info: vi.fn(),
  // Keep error and warn for test debugging
};
