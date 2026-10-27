/**
 * Lightweight In-Memory Cache-Aside Engine for High-Frequency Read Endpoints
 * Provides TTL expiration, LRU eviction, stampede mitigation, and hit/miss telemetry.
 */
class CacheLayer {
  /**
   * @param {Object} options
   * @param {number} [options.maxEntries=500] - Maximum keys before LRU eviction triggers
   * @param {number} [options.defaultTTL=120000] - Default TTL in milliseconds (2 minutes)
   */
  constructor({ maxEntries = 500, defaultTTL = 120000 } = {}) {
    this.cache = new Map();
    this.maxEntries = maxEntries;
    this.defaultTTL = defaultTTL;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Generate a normalized deterministic cache key from request
   * Recursively serializes nested objects and arrays so complex queries
   * (e.g. price[gte]=50&price[lte]=100) produce distinct, collision-free keys.
   * @param {Object} req - Express request object
   * @returns {string}
   */
  generateKey(req) {
    const url = req.baseUrl + (req.path === '/' ? '' : req.path);

    const serializeValue = (val) => {
      if (val === null || val === undefined) return '';
      if (Array.isArray(val)) {
        return `[${val.map(serializeValue).sort().join(',')}]`;
      }
      if (typeof val === 'object') {
        return (
          '{' +
          Object.keys(val)
            .sort()
            .map((k) => `${k}:${serializeValue(val[k])}`)
            .join(',') +
          '}'
        );
      }
      return String(val);
    };

    const sortedQuery = Object.keys(req.query || {})
      .sort()
      .map((k) => `${k}=${serializeValue(req.query[k])}`)
      .join('&');

    return sortedQuery ? `${url}?${sortedQuery}` : url;
  }

  /**
   * Retrieve cached value if present and not expired
   * @param {string} key
   * @returns {any|null}
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // LRU touch: re-insert so key moves to most recently used position
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.hits++;
    return entry.value;
  }

  /**
   * Store a value with TTL
   * @param {string} key
   * @param {any} value
   * @param {number} [ttlMs]
   */
  set(key, value, ttlMs) {
    const ttl = ttlMs !== undefined ? ttlMs : this.defaultTTL;

    // Evict oldest entry if at capacity
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Invalidate specific key or keys matching prefix pattern
   * @param {string|RegExp} pattern
   */
  invalidate(pattern) {
    if (typeof pattern === 'string') {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else if (pattern instanceof RegExp) {
      for (const key of this.cache.keys()) {
        if (pattern.test(key)) {
          this.cache.delete(key);
        }
      }
    }
  }

  /**
   * Clear all cached entries
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Telemetry stats
   */
  getStats() {
    const total = this.hits + this.misses;
    return {
      entries: this.cache.size,
      maxEntries: this.maxEntries,
      hits: this.hits,
      misses: this.misses,
      hitRatio: total > 0 ? (this.hits / total).toFixed(3) : '0.000',
    };
  }

  /**
   * Express middleware wrapper for Cache-Aside pattern
   * @param {number} [ttlMs] - TTL in ms for this endpoint
   */
  middleware(ttlMs) {
    return (req, res, next) => {
      // Only cache safe GET requests
      if (req.method !== 'GET') return next();

      const key = this.generateKey(req);
      const cachedData = this.get(key);

      if (cachedData) {
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(cachedData);
      }

      res.setHeader('X-Cache', 'MISS');

      // Intercept res.json to capture response payload into cache
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        // Only cache successful 200 responses
        if (res.statusCode === 200 && body && body.status === 'success') {
          this.set(key, body, ttlMs);
        }
        return originalJson(body);
      };

      next();
    };
  }

  /**
   * Express middleware to invalidate cache patterns on successful state-changing mutations
   * @param {string|RegExp|string[]} patterns
   */
  invalidator(patterns) {
    const patternList = Array.isArray(patterns) ? patterns : [patterns];
    return (req, res, next) => {
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          patternList.forEach((pattern) => this.invalidate(pattern));
        }
        return originalJson(body);
      };
      next();
    };
  }
}

// Global Singleton Instance
const catalogCache = new CacheLayer({
  maxEntries: 1000,
  defaultTTL: 3 * 60 * 1000, // 3 minutes default
});

module.exports = {
  CacheLayer,
  catalogCache,
};
