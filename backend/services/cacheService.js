/**
 * Cache Service - Redis Integration for DocVerify
 * Provides verification caching, rate limiting, and session management
 */

const Redis = require('ioredis');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.memoryCache = new Map(); // Fallback in-memory cache
    this.memoryCacheTTL = new Map(); // TTL tracking for memory cache
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        lazyConnect: true,
        enableOfflineQueue: false,
      });

      this.client.on('connect', () => {
        console.log('✅ Redis: Connected successfully');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.log('⚠️  Redis: Connection error, using in-memory cache fallback');
        this.isConnected = false;
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });

      await this.client.connect();
      
      // Test connection
      await this.client.ping();
      this.isConnected = true;
      return true;
    } catch (error) {
      console.log('⚠️  Redis: Not available, using in-memory cache fallback');
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Check if Redis is available
   */
  isAvailable() {
    return this.isConnected && this.client !== null;
  }

  /**
   * Clean expired entries from memory cache
   */
  _cleanMemoryCache() {
    const now = Date.now();
    for (const [key, expiry] of this.memoryCacheTTL.entries()) {
      if (expiry < now) {
        this.memoryCache.delete(key);
        this.memoryCacheTTL.delete(key);
      }
    }
  }

  // ==================== BASIC CACHE OPERATIONS ====================

  /**
   * Set a value in cache
   */
  async set(key, value, ttlSeconds = 3600) {
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    if (this.isAvailable()) {
      try {
        await this.client.setex(key, ttlSeconds, stringValue);
        return true;
      } catch (error) {
        console.error('Redis set error:', error.message);
      }
    }
    
    // Fallback to memory cache
    this.memoryCache.set(key, stringValue);
    this.memoryCacheTTL.set(key, Date.now() + (ttlSeconds * 1000));
    return true;
  }

  /**
   * Get a value from cache
   */
  async get(key, parseJson = true) {
    let value = null;

    if (this.isAvailable()) {
      try {
        value = await this.client.get(key);
      } catch (error) {
        console.error('Redis get error:', error.message);
      }
    }
    
    // Fallback to memory cache
    if (value === null) {
      this._cleanMemoryCache();
      value = this.memoryCache.get(key) || null;
    }
    
    if (value && parseJson) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    
    return value;
  }

  /**
   * Delete a value from cache
   */
  async delete(key) {
    if (this.isAvailable()) {
      try {
        await this.client.del(key);
      } catch (error) {
        console.error('Redis delete error:', error.message);
      }
    }
    
    this.memoryCache.delete(key);
    this.memoryCacheTTL.delete(key);
    return true;
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    if (this.isAvailable()) {
      try {
        return await this.client.exists(key) === 1;
      } catch (error) {
        console.error('Redis exists error:', error.message);
      }
    }
    
    this._cleanMemoryCache();
    return this.memoryCache.has(key);
  }

  // ==================== VERIFICATION CACHING ====================

  /**
   * Cache verification result
   */
  async cacheVerification(certificateId, result, ttlSeconds = 300) {
    const key = `verify:${certificateId}`;
    return this.set(key, result, ttlSeconds);
  }

  /**
   * Get cached verification result
   */
  async getCachedVerification(certificateId) {
    const key = `verify:${certificateId}`;
    return this.get(key);
  }

  /**
   * Invalidate verification cache
   */
  async invalidateVerification(certificateId) {
    const key = `verify:${certificateId}`;
    return this.delete(key);
  }

  /**
   * Cache blockchain verification result (longer TTL)
   */
  async cacheBlockchainVerification(documentHash, result, ttlSeconds = 600) {
    const key = `blockchain:${documentHash}`;
    return this.set(key, result, ttlSeconds);
  }

  /**
   * Get cached blockchain verification
   */
  async getCachedBlockchainVerification(documentHash) {
    const key = `blockchain:${documentHash}`;
    return this.get(key);
  }

  // ==================== RATE LIMITING ====================

  /**
   * Check and update rate limit
   * @param {string} identifier - IP address or user ID
   * @param {string} action - The action being rate limited
   * @param {number} maxRequests - Maximum requests allowed
   * @param {number} windowSeconds - Time window in seconds
   * @returns {Object} - { allowed: boolean, remaining: number, resetIn: number }
   */
  async checkRateLimit(identifier, action, maxRequests = 100, windowSeconds = 60) {
    const key = `ratelimit:${action}:${identifier}`;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    if (this.isAvailable()) {
      try {
        // Use Redis sorted set for sliding window
        const windowStart = now - windowMs;
        
        // Remove old entries
        await this.client.zremrangebyscore(key, 0, windowStart);
        
        // Count current requests in window
        const currentCount = await this.client.zcard(key);
        
        if (currentCount >= maxRequests) {
          // Get oldest entry to calculate reset time
          const oldest = await this.client.zrange(key, 0, 0, 'WITHSCORES');
          const resetIn = oldest.length > 1 
            ? Math.ceil((parseInt(oldest[1]) + windowMs - now) / 1000)
            : windowSeconds;
          
          return {
            allowed: false,
            remaining: 0,
            resetIn,
            total: maxRequests,
          };
        }
        
        // Add current request
        await this.client.zadd(key, now, `${now}-${Math.random()}`);
        await this.client.expire(key, windowSeconds + 1);
        
        return {
          allowed: true,
          remaining: maxRequests - currentCount - 1,
          resetIn: windowSeconds,
          total: maxRequests,
        };
      } catch (error) {
        console.error('Redis rate limit error:', error.message);
      }
    }
    
    // Fallback: simple in-memory rate limiting
    const memKey = key;
    this._cleanMemoryCache();
    
    const current = this.memoryCache.get(memKey) || { count: 0, resetAt: now + windowMs };
    
    if (now > current.resetAt) {
      current.count = 0;
      current.resetAt = now + windowMs;
    }
    
    if (current.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: Math.ceil((current.resetAt - now) / 1000),
        total: maxRequests,
      };
    }
    
    current.count++;
    this.memoryCache.set(memKey, current);
    this.memoryCacheTTL.set(memKey, current.resetAt);
    
    return {
      allowed: true,
      remaining: maxRequests - current.count,
      resetIn: Math.ceil((current.resetAt - now) / 1000),
      total: maxRequests,
    };
  }

  /**
   * Get rate limit middleware
   */
  rateLimitMiddleware(action, maxRequests = 100, windowSeconds = 60) {
    return async (req, res, next) => {
      const identifier = req.user?.id || req.ip || 'anonymous';
      const result = await this.checkRateLimit(identifier, action, maxRequests, windowSeconds);
      
      // Set rate limit headers
      res.set('X-RateLimit-Limit', result.total);
      res.set('X-RateLimit-Remaining', result.remaining);
      res.set('X-RateLimit-Reset', result.resetIn);
      
      if (!result.allowed) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.',
          retryAfter: result.resetIn,
        });
      }
      
      next();
    };
  }

  // ==================== SESSION MANAGEMENT ====================

  /**
   * Store session data
   */
  async setSession(sessionId, data, ttlSeconds = 86400) {
    const key = `session:${sessionId}`;
    return this.set(key, data, ttlSeconds);
  }

  /**
   * Get session data
   */
  async getSession(sessionId) {
    const key = `session:${sessionId}`;
    return this.get(key);
  }

  /**
   * Update session data
   */
  async updateSession(sessionId, data, ttlSeconds = 86400) {
    const existing = await this.getSession(sessionId);
    if (existing) {
      return this.setSession(sessionId, { ...existing, ...data }, ttlSeconds);
    }
    return this.setSession(sessionId, data, ttlSeconds);
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId) {
    const key = `session:${sessionId}`;
    return this.delete(key);
  }

  /**
   * Extend session TTL
   */
  async extendSession(sessionId, ttlSeconds = 86400) {
    const key = `session:${sessionId}`;
    const data = await this.getSession(sessionId);
    if (data) {
      return this.setSession(sessionId, data, ttlSeconds);
    }
    return false;
  }

  // ==================== ANALYTICS CACHING ====================

  /**
   * Increment a counter
   */
  async incrementCounter(key, amount = 1) {
    const fullKey = `counter:${key}`;
    
    if (this.isAvailable()) {
      try {
        return await this.client.incrby(fullKey, amount);
      } catch (error) {
        console.error('Redis increment error:', error.message);
      }
    }
    
    // Fallback
    const current = parseInt(this.memoryCache.get(fullKey) || '0');
    const newValue = current + amount;
    this.memoryCache.set(fullKey, String(newValue));
    return newValue;
  }

  /**
   * Get counter value
   */
  async getCounter(key) {
    const fullKey = `counter:${key}`;
    
    if (this.isAvailable()) {
      try {
        const value = await this.client.get(fullKey);
        return parseInt(value || '0');
      } catch (error) {
        console.error('Redis get counter error:', error.message);
      }
    }
    
    return parseInt(this.memoryCache.get(fullKey) || '0');
  }

  /**
   * Cache analytics data
   */
  async cacheAnalytics(type, data, ttlSeconds = 300) {
    const key = `analytics:${type}`;
    return this.set(key, data, ttlSeconds);
  }

  /**
   * Get cached analytics
   */
  async getCachedAnalytics(type) {
    const key = `analytics:${type}`;
    return this.get(key);
  }

  // ==================== DOCUMENT DATA CACHING ====================

  /**
   * Cache document metadata
   */
  async cacheDocument(documentId, data, ttlSeconds = 1800) {
    const key = `doc:${documentId}`;
    return this.set(key, data, ttlSeconds);
  }

  /**
   * Get cached document
   */
  async getCachedDocument(documentId) {
    const key = `doc:${documentId}`;
    return this.get(key);
  }

  /**
   * Invalidate document cache
   */
  async invalidateDocument(documentId) {
    const key = `doc:${documentId}`;
    return this.delete(key);
  }

  // ==================== AI EXTRACTION CACHING ====================

  /**
   * Cache AI extraction result (to avoid re-processing same content)
   */
  async cacheAIExtraction(contentHash, result, ttlSeconds = 3600) {
    const key = `ai:extract:${contentHash}`;
    return this.set(key, result, ttlSeconds);
  }

  /**
   * Get cached AI extraction
   */
  async getCachedAIExtraction(contentHash) {
    const key = `ai:extract:${contentHash}`;
    return this.get(key);
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Clear all cache (use with caution)
   */
  async clearAll() {
    if (this.isAvailable()) {
      try {
        await this.client.flushdb();
      } catch (error) {
        console.error('Redis flush error:', error.message);
      }
    }
    
    this.memoryCache.clear();
    this.memoryCacheTTL.clear();
    return true;
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    const stats = {
      isRedisConnected: this.isConnected,
      memoryCacheSize: this.memoryCache.size,
    };

    if (this.isAvailable()) {
      try {
        const info = await this.client.info('stats');
        const memory = await this.client.info('memory');
        
        // Parse Redis info
        const parseInfo = (str) => {
          const result = {};
          str.split('\r\n').forEach(line => {
            const [key, value] = line.split(':');
            if (key && value) result[key] = value;
          });
          return result;
        };

        const statsInfo = parseInfo(info);
        const memoryInfo = parseInfo(memory);

        stats.redis = {
          totalConnections: statsInfo.total_connections_received,
          totalCommands: statsInfo.total_commands_processed,
          usedMemory: memoryInfo.used_memory_human,
          connectedClients: statsInfo.connected_clients,
        };
      } catch (error) {
        stats.redisError = error.message;
      }
    }

    return stats;
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

// Export singleton instance
const cacheService = new CacheService();
module.exports = cacheService;
