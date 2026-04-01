import { NextRequest, NextResponse } from 'next/server';
import { buildAppUrl } from '@/lib/appUrl';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const nextPath = requestUrl.searchParams.get('next') ?? '/intake';
  const redirectUrl = new URL(buildAppUrl(nextPath, requestUrl.origin));
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.redirect(redirectUrl);
  }

  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  } else if (tokenHash && type) {
    await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as
        | 'email'
        | 'signup'
        | 'recovery'
        | 'invite'
        | 'email_change'
        | 'magiclink',
    });
  }

  return NextResponse.redirect(redirectUrl);
}
