/**
 * Tests for logger utility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Logger } from '../../../src/utils/logger';

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when disabled', () => {
    it('should not log debug messages', () => {
      const logger = new Logger(false);
      const debugSpy = vi.spyOn(console, 'debug');

      logger.debug('test message');

      expect(debugSpy).not.toHaveBeenCalled();
    });

    it('should not log info messages', () => {
      const logger = new Logger(false);
      const infoSpy = vi.spyOn(console, 'info');

      logger.info('test message');

      expect(infoSpy).not.toHaveBeenCalled();
    });

    it('should not log warn messages', () => {
      const logger = new Logger(false);
      const warnSpy = vi.spyOn(console, 'warn');

      logger.warn('test message');

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should not log error messages', () => {
      const logger = new Logger(false);
      const errorSpy = vi.spyOn(console, 'error');

      logger.error('test message');

      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  describe('when enabled', () => {
    it('should log debug messages with prefix', () => {
      const logger = new Logger(true);
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      logger.debug('test message', { key: 'value' });

      expect(debugSpy).toHaveBeenCalledWith(
        '[AI-Integrator] test message',
        { key: 'value' }
      );
    });

    it('should log info messages with prefix', () => {
      const logger = new Logger(true);
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      logger.info('test message');

      expect(infoSpy).toHaveBeenCalledWith('[AI-Integrator] test message');
    });

    it('should log warn messages with prefix', () => {
      const logger = new Logger(true);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      logger.warn('test message');

      expect(warnSpy).toHaveBeenCalledWith('[AI-Integrator] test message');
    });

    it('should log error messages with prefix', () => {
      const logger = new Logger(true);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      logger.error('test message');

      expect(errorSpy).toHaveBeenCalledWith('[AI-Integrator] test message');
    });

    it('should handle multiple arguments', () => {
      const logger = new Logger(true);
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      logger.debug('message', 'arg1', 'arg2', 'arg3');

      expect(debugSpy).toHaveBeenCalledWith(
        '[AI-Integrator] message',
        'arg1',
        'arg2',
        'arg3'
      );
    });
  });

  describe('setEnabled', () => {
    it('should enable logging', () => {
      const logger = new Logger(false);
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      logger.setEnabled(true);
      logger.info('test message');

      expect(infoSpy).toHaveBeenCalledWith('[AI-Integrator] test message');
    });

    it('should disable logging', () => {
      const logger = new Logger(true);
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      logger.setEnabled(false);
      logger.info('test message');

      expect(infoSpy).not.toHaveBeenCalled();
    });
  });

  describe('default state', () => {
    it('should be disabled by default', () => {
      const logger = new Logger();
      const debugSpy = vi.spyOn(console, 'debug');

      logger.debug('test message');

      expect(debugSpy).not.toHaveBeenCalled();
    });
  });
});
