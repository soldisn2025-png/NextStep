import { NextResponse } from 'next/server';
import { aiRateLimit } from '@/lib/rateLimit';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function serializeRateLimitResult(result: Awaited<ReturnType<typeof aiRateLimit.limit>>) {
  return {
    success: result.success,
    limit: result.limit ?? null,
    remaining: result.remaining ?? null,
    reset: result.reset ?? null,
  };
}

export async function POST() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Authentication not configured.' }, { status: 503 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Sign in to use this feature.' }, { status: 401 });
  }

  const result = await aiRateLimit.limit(user.id);
  const payload = {
    source: 'app-rate-limit',
    identifier: 'user.id',
    result: serializeRateLimitResult(result),
  };

  if (!result.success) {
    return NextResponse.json(payload, { status: 429 });
  }

  return NextResponse.json(payload, { status: 200 });
}