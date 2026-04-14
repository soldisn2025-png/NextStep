import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Minimal interface — only what the routes use.
interface RateLimiter {
  limit(identifier: string): Promise<{ success: boolean }>;
}

function buildRateLimit(): RateLimiter {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    // No Redis configured — passthrough allows every request.
    return { limit: async (_id: string) => ({ success: true }) };
  }
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(20, '60 s'),
    prefix: 'nextstep:ai',
  });
}

export const aiRateLimit = buildRateLimit();
