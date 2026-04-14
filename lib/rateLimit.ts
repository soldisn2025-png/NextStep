import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export interface RateLimitResult {
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
  pending?: Promise<unknown>;
}

interface RateLimiter {
  limit(identifier: string): Promise<RateLimitResult>;
}

function buildRateLimit(): RateLimiter {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return {
      limit: async (_id: string) => ({
        success: true,
      }),
    };
  }

  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(20, '60 s'),
    prefix: 'nextstep:ai',
  });
}

export const aiRateLimit = buildRateLimit();