'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { buildAppUrl } from '@/lib/appUrl';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';

interface SupabaseAuthContextValue {
  user: User | null;
  session: Session | null;
  isConfigured: boolean;
  isLoading: boolean;
  magicLinkSentTo: string | null;
  sendMagicLink: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextValue | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [magicLinkSentTo, setMagicLinkSentTo] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<SupabaseAuthContextValue>(
    () => ({
      user,
      session,
      isConfigured: configured,
      isLoading,
      magicLinkSentTo,
      async sendMagicLink(email: string) {
        const supabase = getSupabaseBrowserClient();

        if (!supabase) {
          return { error: 'Supabase is not configured in this deployment.' };
        }

        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: buildAppUrl('/auth/callback?next=/intake', window.location.origin),
          },
        });

        if (!error) {
          setMagicLinkSentTo(email);
        }

        return { error: error?.message ?? null };
      },
      async signOut() {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
          return;
        }

        await supabase.auth.signOut();
        setMagicLinkSentTo(null);
      },
    }),
    [configured, isLoading, magicLinkSentTo, session, user]
  );

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);

  if (!context) {
    throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider.');
  }

  return context;
}
