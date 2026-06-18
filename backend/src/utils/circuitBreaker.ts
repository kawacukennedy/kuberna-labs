import logger from './logger.js';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  name: string;
  shouldCountFailure?: (error: unknown) => boolean;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureTimestamps: number[] = [];
  private lastOpenTime = 0;
  private halfOpenLock = false;
  private readonly config: {
    failureThreshold: number;
    resetTimeout: number;
    name: string;
    shouldCountFailure: (error: unknown) => boolean;
  };

  constructor(config: CircuitBreakerConfig) {
    this.config = {
      failureThreshold: config.failureThreshold,
      resetTimeout: config.resetTimeout,
      name: config.name,
      shouldCountFailure: config.shouldCountFailure ?? (() => true),
    };
  }

  getState(): CircuitState {
    if (this.state === 'OPEN' && Date.now() - this.lastOpenTime >= this.config.resetTimeout) {
      this.transitionTo('HALF_OPEN');
    }
    return this.state;
  }

  private transitionTo(newState: CircuitState): void {
    if (this.state !== newState) {
      const from = this.state;
      this.state = newState;
      logger.info(`Circuit breaker "${this.config.name}" state changed`, {
        from,
        to: newState,
      });
    }
  }

  private purgeOldFailures(): void {
    const cutoff = Date.now() - 5 * 60 * 1000;
    this.failureTimestamps = this.failureTimestamps.filter(t => t > cutoff);
  }

  private recordFailure(): void {
    this.purgeOldFailures();
    this.failureTimestamps.push(Date.now());
    if (this.failureTimestamps.length >= this.config.failureThreshold) {
      this.transitionTo('OPEN');
      this.lastOpenTime = Date.now();
    }
  }

  private onSuccess(): void {
    this.failureTimestamps = [];
    if (this.state === 'HALF_OPEN') {
      this.halfOpenLock = false;
      this.transitionTo('CLOSED');
    }
  }

  async call<T>(fn: () => Promise<T>, fallback: () => T): Promise<T> {
    const state = this.getState();

    if (state === 'OPEN') {
      return fallback();
    }

    if (state === 'HALF_OPEN') {
      if (this.halfOpenLock) {
        return fallback();
      }
      this.halfOpenLock = true;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      const countsAsFailure = this.config.shouldCountFailure(error);

      if (countsAsFailure) {
        this.recordFailure();
        if (this.state === 'HALF_OPEN') {
          this.halfOpenLock = false;
          this.transitionTo('OPEN');
          this.lastOpenTime = Date.now();
        }
      } else if (this.state === 'HALF_OPEN') {
        this.halfOpenLock = false;
        this.failureTimestamps = [];
        this.transitionTo('CLOSED');
      }

      return fallback();
    }
  }
}
