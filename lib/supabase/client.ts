'use client';

import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabasePublishableKey, supabaseUrl } from './config';

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (!supabaseUrl || !supabasePublishableKey) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabasePublishableKey);
  }

  return browserClient;
}
