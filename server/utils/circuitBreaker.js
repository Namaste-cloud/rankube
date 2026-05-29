const logger = require('./logger');

const STATE = {
  CLOSED: 'CLOSED',       // Normal operation
  OPEN: 'OPEN',           // Failing, block requests
  HALF_OPEN: 'HALF_OPEN', // Testing if recovered
};

class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 3;
    this.resetTimeout = options.resetTimeout || 30000;
    
    this.state = STATE.CLOSED;
    this.failures = 0;
    this.nextAttempt = 0;
  }

  async execute(fn) {
    if (this.state === STATE.OPEN) {
      if (Date.now() > this.nextAttempt) {
        logger.info(`CircuitBreaker [${this.name}] transitioning to HALF_OPEN`);
        this.state = STATE.HALF_OPEN;
      } else {
        throw new Error(`Circuit breaker for ${this.name} is OPEN`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  onSuccess() {
    if (this.state === STATE.HALF_OPEN) {
      logger.info(`CircuitBreaker [${this.name}] transitioning to CLOSED`);
    }
    this.state = STATE.CLOSED;
    this.failures = 0;
  }

  onFailure(error) {
    this.failures += 1;
    if (this.state === STATE.CLOSED && this.failures >= this.failureThreshold) {
      this.state = STATE.OPEN;
      this.nextAttempt = Date.now() + this.resetTimeout;
      logger.warn(`CircuitBreaker [${this.name}] transitioning to OPEN. Next attempt in ${this.resetTimeout}ms`, { error: error.message });
    } else if (this.state === STATE.HALF_OPEN) {
      this.state = STATE.OPEN;
      this.nextAttempt = Date.now() + this.resetTimeout;
      logger.warn(`CircuitBreaker [${this.name}] HALF_OPEN failed, transitioning back to OPEN`, { error: error.message });
    }
  }
}

module.exports = CircuitBreaker;
