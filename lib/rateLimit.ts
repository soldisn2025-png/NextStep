import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

function buildRateLimit() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    // No Redis configured — return a passthrough limiter (always allows)
    return { limit: async (_id: string) => ({ success: true }) };
  }
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(20, '60 s'),
    prefix: 'nextstep:ai',
  });
}

export const aiRateLimit = buildRateLimit();
