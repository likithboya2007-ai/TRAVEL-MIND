/**
 * In-memory rate limiter for API endpoints
 * Tracks requests per user with sliding window
 * Can be swapped with Upstash Redis for production multi-instance deployments
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry>;
  
  constructor() {
    this.store = new Map();
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }
  
  /**
   * Check if a request should be allowed
   * @param userId - User ID from authenticated token
   * @param config - Rate limit configuration
   * @returns true if allowed, false if rate limit exceeded
   */
  check(userId: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const key = userId;
    const entry = this.store.get(key);
    
    // First request or expired window
    if (!entry || now > entry.resetAt) {
      this.store.set(key, {
        count: 1,
        resetAt: now + config.windowMs,
      });
      return true;
    }
    
    // Within window, check count
    if (entry.count >= config.maxRequests) {
      return false; // Rate limit exceeded
    }
    
    // Increment count
    entry.count++;
    this.store.set(key, entry);
    return true;
  }
  
  /**
   * Get remaining requests and reset time for a user
   */
  getStatus(userId: string, config: RateLimitConfig): {
    remaining: number;
    resetAt: number;
  } {
    const entry = this.store.get(userId);
    const now = Date.now();
    
    if (!entry || now > entry.resetAt) {
      return {
        remaining: config.maxRequests,
        resetAt: now + config.windowMs,
      };
    }
    
    return {
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetAt: entry.resetAt,
    };
  }
  
  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }
  
  /**
   * Reset rate limit for a specific user (for testing)
   */
  reset(userId: string): void {
    this.store.delete(userId);
  }
  
  /**
   * Clear all entries (for testing)
   */
  clear(): void {
    this.store.clear();
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

// Rate limit configurations
export const RATE_LIMITS = {
  chat: {
    maxRequests: parseInt(process.env.CHAT_RATE_LIMIT || '20', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '600000', 10), // 10 minutes default
  },
  routing: {
    maxRequests: parseInt(process.env.ROUTING_RATE_LIMIT || '60', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '600000', 10), // 10 minutes default
  },
  attractions: {
    maxRequests: parseInt(process.env.ATTRACTIONS_RATE_LIMIT || '10', 10),
    windowMs: 600000, // 10 minutes
  },
};

export default rateLimiter;
