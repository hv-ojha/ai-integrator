/**
 * Simple logger utility for debugging
 */
export class Logger {
  constructor(private enabled: boolean = false) {}

  debug(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.debug(`[AI-Integrator] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.info(`[AI-Integrator] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.warn(`[AI-Integrator] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.error(`[AI-Integrator] ${message}`, ...args);
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}
