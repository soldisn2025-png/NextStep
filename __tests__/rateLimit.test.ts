import { describe, expect, it, beforeEach, afterEach } from 'vitest';

describe('smsRateLimit — graceful fallback without Upstash (#4 fix)', () => {
  let originalUrl: string | undefined;
  let originalToken: string | undefined;

  beforeEach(() => {
    originalUrl = process.env.UPSTASH_REDIS_REST_URL;
    originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
  });

  it('smsRateLimit is exported from rateLimit module', async () => {
    const mod = await import('@/lib/rateLimit');
    expect(mod.smsRateLimit).toBeDefined();
    expect(typeof mod.smsRateLimit.limit).toBe('function');
  });

  it('allows all requests when Upstash is not configured', async () => {
    const mod = await import('@/lib/rateLimit');
    const result = await mod.smsRateLimit.limit('test-user-id');
    expect(result.success).toBe(true);
  });

  it('aiRateLimit and providerRateLimit also allow requests without Upstash', async () => {
    const mod = await import('@/lib/rateLimit');
    const ai = await mod.aiRateLimit.limit('test-user-id');
    const provider = await mod.providerRateLimit.limit('test-user-id');
    expect(ai.success).toBe(true);
    expect(provider.success).toBe(true);
  });
});
