'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { LogIn, LogOut, Mail, RefreshCw, UserRound } from 'lucide-react';
import { useSupabaseAuth } from '@/components/providers/SupabaseAuthProvider';

export default function AuthMenu() {
  const { user, isConfigured, isLoading, magicLinkSentTo, sendMagicLink, signOut } =
    useSupabaseAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError('Enter an email address.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = await sendMagicLink(normalizedEmail);
    if (result.error) {
      setError(result.error);
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-[#ddd3bf] bg-white px-3 py-2 text-xs text-[#6f6a5b] font-body">
        <RefreshCw size={13} className="animate-spin" />
        Checking account
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-[#e7decd] bg-[#fffdf8] px-3 py-2 text-xs text-[#6f6a5b] font-body">
        <Mail size={13} />
        Account sync not configured
      </div>
    );
  }

  if (user) {
    return (
      <details className="relative">
        <summary className="list-none cursor-pointer rounded-full border border-[#ddd3bf] bg-white px-3 py-2 text-sm text-[#5a5549] font-body transition-colors hover:border-[#7f7a57] hover:text-[#504b40]">
          <span className="inline-flex items-center gap-2">
            <UserRound size={14} />
            {user.email ?? 'Account'}
          </span>
        </summary>
        <div className="absolute right-0 mt-3 w-[280px] rounded-[24px] border border-[#ddd3bf] bg-white/95 p-4 shadow-[0_24px_60px_-40px_rgba(54,44,28,0.55)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
            Signed in
          </p>
          <p className="mt-2 text-sm text-text-main font-body break-all">
            {user.email}
          </p>
          <p className="mt-2 text-xs text-[#8a8377] font-body leading-relaxed">
            This account can sync your plan across devices once Supabase data storage is set up.
          </p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#ddd3bf] bg-white px-4 py-2 text-sm text-[#5a5549] font-body transition-colors hover:border-[#7f7a57] hover:text-[#504b40]"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </details>
    );
  }

  return (
    <details className="relative">
      <summary className="list-none cursor-pointer rounded-full bg-[#6d6b47] px-4 py-2 text-sm text-white font-body transition-colors hover:bg-[#5a583a]">
        <span className="inline-flex items-center gap-2">
          <LogIn size={14} />
          Save across devices
        </span>
      </summary>
      <div className="absolute right-0 mt-3 w-[320px] rounded-[24px] border border-[#ddd3bf] bg-white/95 p-4 shadow-[0_24px_60px_-40px_rgba(54,44,28,0.55)]">
        <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
          Account sync
        </p>
        <h3 className="mt-2 font-heading text-xl text-text-main">Send a magic link</h3>
        <p className="mt-2 text-sm text-[#625e53] font-body leading-relaxed">
          No password flow for now. We will email a sign-in link and then sync your saved plan.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label htmlFor="accountEmail" className="sr-only">
            Email address
          </label>
          <input
            id="accountEmail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-[18px] border border-[#ddd3bf] bg-[#fffdf8] px-4 py-3 text-sm text-text-main font-body outline-none transition-all focus:border-[#7f7a57] focus:ring-2 focus:ring-[#7f7a57]/15"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#6d6b47] px-4 py-2.5 text-sm text-white font-body transition-colors hover:bg-[#5a583a] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Mail size={14} />}
            {isSubmitting ? 'Sending link' : 'Email me a sign-in link'}
          </button>
        </form>
        {magicLinkSentTo && (
          <p className="mt-3 text-sm text-[#4f6d4e] font-body">
            Link sent to {magicLinkSentTo}.
          </p>
        )}
        {error && (
          <p className="mt-3 text-sm text-[#a25547] font-body">
            {error}
          </p>
        )}
      </div>
    </details>
  );
}
