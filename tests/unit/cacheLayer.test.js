import { describe, it, expect, beforeEach, vi } from 'vitest';
const { CacheLayer } = require('../../backend/utils/cacheLayer');

describe('CacheLayer In-Memory Cache Engine Unit Tests', () => {
  let cache;

  beforeEach(() => {
    cache = new CacheLayer({ maxEntries: 3, defaultTTL: 1000 });
  });

  describe('generateKey', () => {
    it('should generate canonical key with url and sorted primitive query parameters', () => {
      const req = {
        baseUrl: '/api/v1/products',
        path: '/',
        query: { sort: '-price', limit: '10', page: '1' },
      };

      const key = cache.generateKey(req);
      expect(key).toBe('/api/v1/products?limit=10&page=1&sort=-price');
    });

    it('should properly serialize nested objects without [object Object] collisions', () => {
      const req1 = {
        baseUrl: '/api/v1/products',
        path: '/',
        query: { price: { gte: '50', lte: '100' } },
      };

      const req2 = {
        baseUrl: '/api/v1/products',
        path: '/',
        query: { price: { lte: '25' } },
      };

      const req3 = {
        baseUrl: '/api/v1/products',
        path: '/',
        query: { price: { gte: '100' } },
      };

      const key1 = cache.generateKey(req1);
      const key2 = cache.generateKey(req2);
      const key3 = cache.generateKey(req3);

      expect(key1).toBe('/api/v1/products?price={gte:50,lte:100}');
      expect(key2).toBe('/api/v1/products?price={lte:25}');
      expect(key3).toBe('/api/v1/products?price={gte:100}');

      // Must never collide with each other
      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);
      expect(key1).not.toContain('[object Object]');
    });

    it('should produce identical keys regardless of nested object key insertion order', () => {
      const reqA = {
        baseUrl: '/api/v1/products',
        path: '/',
        query: { price: { lte: '100', gte: '50' } },
      };

      const reqB = {
        baseUrl: '/api/v1/products',
        path: '/',
        query: { price: { gte: '50', lte: '100' } },
      };

      expect(cache.generateKey(reqA)).toBe(cache.generateKey(reqB));
    });

    it('should handle arrays and undefined/null query values cleanly', () => {
      const req = {
        baseUrl: '/api/v1/products',
        path: '/search',
        query: { tags: ['tech', 'audio'], filter: null, empty: undefined },
      };

      const key = cache.generateKey(req);
      expect(key).toBe('/api/v1/products/search?empty=&filter=&tags=[audio,tech]');
    });
  });

  describe('get, set, TTL and LRU Eviction', () => {
    it('should store and retrieve values within TTL', () => {
      cache.set('key1', { data: 'test1' }, 5000);
      expect(cache.get('key1')).toEqual({ data: 'test1' });
      expect(cache.hits).toBe(1);
    });

    it('should return null and increment misses when expired', () => {
      vi.useFakeTimers();
      cache.set('key1', { data: 'test1' }, 100);

      vi.advanceTimersByTime(150);
      expect(cache.get('key1')).toBeNull();
      expect(cache.misses).toBe(1);
      vi.useRealTimers();
    });

    it('should evict oldest entry when exceeding maxEntries', () => {
      cache.set('k1', 'val1');
      cache.set('k2', 'val2');
      cache.set('k3', 'val3');
      // Adding a 4th entry exceeds maxEntries: 3, should evict k1
      cache.set('k4', 'val4');

      expect(cache.get('k1')).toBeNull();
      expect(cache.get('k2')).toBe('val2');
      expect(cache.get('k3')).toBe('val3');
      expect(cache.get('k4')).toBe('val4');
    });

    it('should invalidate keys matching string prefix or regex pattern', () => {
      cache.set('/api/v1/products?cat=1', 'data1');
      cache.set('/api/v1/products?cat=2', 'data2');
      cache.set('/api/v1/categories', 'data3');

      cache.invalidate('/api/v1/products');

      expect(cache.get('/api/v1/products?cat=1')).toBeNull();
      expect(cache.get('/api/v1/products?cat=2')).toBeNull();
      expect(cache.get('/api/v1/categories')).toBe('data3');
    });
  });
});
