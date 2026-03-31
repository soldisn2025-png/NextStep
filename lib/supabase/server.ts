import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabasePublishableKey, supabaseUrl } from './config';

export function getSupabaseServerClient() {
  const cookieStore = cookies();

  if (!supabaseUrl || !supabasePublishableKey) {
    return null;
  }

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server components cannot always write cookies.
        }
      },
    },
  });
}
