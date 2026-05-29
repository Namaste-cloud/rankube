const logger = require('../utils/logger');
const { INVIDIOUS_INSTANCES_URL, TIMEOUTS } = require('../utils/constants');
const CircuitBreaker = require('../utils/circuitBreaker');

class InstanceOrchestrator {
  constructor() {
    this.instances = [];
    this.breakers = new Map();
    this.lastRefresh = 0;
  }

  async refreshInstances() {
    try {
      logger.info('Refreshing Invidious instance list...');
      const response = await fetch(INVIDIOUS_INSTANCES_URL, {
        signal: AbortSignal.timeout(TIMEOUTS.HEALTH_CHECK * 2)
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      
      this.instances = data
        .filter(([domain, meta]) => {
          // Filter healthy HTTPS instances with API enabled
          if (meta.type !== 'https' || !meta.api) return false;
          
          // Check uptime if monitor data is available
          if (meta.monitor) {
            const uptime30d = meta.monitor['30dRatio']?.ratio;
            if (uptime30d && parseFloat(uptime30d) < 90) return false;
            if (meta.monitor.down) return false;
          }
          return true;
        })
        .map(([domain, meta]) => {
          let score = 0;
          if (meta.monitor && meta.monitor['30dRatio']) {
             score += parseFloat(meta.monitor['30dRatio'].ratio) * 0.4;
          } else {
             score += 95 * 0.4; // assume somewhat healthy if no monitor data
          }
          
          if (meta.stats && meta.stats.playback && meta.stats.playback.ratio) {
             score += meta.stats.playback.ratio * 100 * 0.3;
          }

          return {
            domain,
            uri: meta.uri,
            region: meta.region,
            score
          };
        })
        .sort((a, b) => b.score - a.score);

      // Initialize circuit breakers for new instances
      this.instances.forEach(inst => {
        if (!this.breakers.has(inst.uri)) {
          this.breakers.set(inst.uri, new CircuitBreaker(`invidious-${inst.domain}`));
        }
      });

      this.lastRefresh = Date.now();
      logger.info(`Successfully loaded ${this.instances.length} healthy Invidious instances`);
    } catch (error) {
      logger.error('Failed to refresh Invidious instances', { error: error.message });
      // If we have some instances, we can continue. Otherwise, we might have issues.
    }
  }

  getTopInstances(count = 3) {
    if (this.instances.length === 0) return [];
    
    // Return instances whose circuit breakers are not OPEN
    const available = this.instances.filter(inst => {
      const breaker = this.breakers.get(inst.uri);
      return breaker && breaker.state !== 'OPEN';
    });

    return available.slice(0, count);
  }

  getBreaker(uri) {
    return this.breakers.get(uri);
  }

  getInstanceHealth() {
    const total = this.instances.length;
    let available = 0;
    
    this.instances.forEach(inst => {
      const breaker = this.breakers.get(inst.uri);
      if (breaker && breaker.state !== 'OPEN') available++;
    });

    return {
      total,
      available,
      lastRefresh: new Date(this.lastRefresh).toISOString()
    };
  }
}

// Export a singleton instance
const instanceOrchestrator = new InstanceOrchestrator();
module.exports = instanceOrchestrator;
