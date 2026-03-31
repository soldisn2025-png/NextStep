'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, MessageSquareText, Smartphone } from 'lucide-react';
import { useSupabaseAuth } from '@/components/providers/SupabaseAuthProvider';

interface SmsPreferenceResponse {
  phoneNumber: string;
  phoneNumberLabel: string;
  smsOptIn: boolean;
  timeZone: string;
  updatedAt: string | null;
  deliveryConfigured: boolean;
  error?: string;
}

export default function SmsReminderSetup() {
  const { user, isConfigured, isLoading } = useSupabaseAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [timeZone, setTimeZone] = useState('America/New_York');
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState('');
  const [deliveryConfigured, setDeliveryConfigured] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (browserTimeZone) {
      setTimeZone(browserTimeZone);
    }
  }, []);

  useEffect(() => {
    if (!isConfigured || !user) {
      return;
    }

    let cancelled = false;

    const loadPreferences = async () => {
      setIsFetching(true);
      setError('');

      try {
        const response = await fetch('/api/reminders/sms-preferences', {
          cache: 'no-store',
        });
        const payload = (await response.json()) as SmsPreferenceResponse;

        if (!response.ok) {
          if (!cancelled) {
            setError(payload.error ?? 'Could not load SMS reminder settings.');
          }
          return;
        }

        if (!cancelled) {
          setPhoneNumber(payload.phoneNumber ?? '');
          setSmsOptIn(payload.smsOptIn ?? false);
          setTimeZone(payload.timeZone ?? timeZone);
          setDeliveryConfigured(payload.deliveryConfigured ?? false);
          setUpdatedAt(payload.updatedAt ?? null);
        }
      } catch {
        if (!cancelled) {
          setError('Could not load SMS reminder settings.');
        }
      } finally {
        if (!cancelled) {
          setIsFetching(false);
        }
      }
    };

    void loadPreferences();

    return () => {
      cancelled = true;
    };
  }, [isConfigured, timeZone, user]);

  const helperMessage = useMemo(() => {
    if (!deliveryConfigured) {
      return 'The SMS delivery backend is not configured in this deployment yet. You can save your number now, but messages will not send until Twilio and cron env vars are added.';
    }

    return 'SMS reminders are sent around 9 AM in your local time zone for steps that already have a follow-up date and reminder setting.';
  }, [deliveryConfigured]);

  if (!isConfigured) {
    return (
      <div className="rounded-[24px] border border-[#e7decd] bg-[#fffdf8] px-4 py-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
          SMS reminders
        </p>
        <p className="mt-2 text-sm text-[#625e53] font-body leading-relaxed">
          SMS reminders require account sync, which is not configured in this deployment yet.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-[24px] border border-[#e7decd] bg-[#fffdf8] px-4 py-4">
        <p className="text-sm text-[#625e53] font-body">Loading reminder settings...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-[24px] border border-[#e7decd] bg-[#fffdf8] px-4 py-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
          SMS reminders
        </p>
        <p className="mt-2 text-sm text-[#625e53] font-body leading-relaxed">
          Sign in first if you want the app to send SMS follow-up reminders across devices.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-[#e3dac9] bg-white/88 px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef3ff] text-primary flex-shrink-0">
          <Smartphone size={16} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
            SMS reminders
          </p>
          <h4 className="mt-1 font-heading text-lg text-text-main">
            Send follow-up nudges to a phone.
          </h4>
          <p className="mt-2 text-sm text-[#625e53] font-body leading-relaxed">
            US numbers only for now. Message and data rates may apply.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <label
          htmlFor="sms-phone-number"
          className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body"
        >
          Mobile number
        </label>
        <input
          id="sms-phone-number"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
          placeholder="(555) 555-1234"
          className="mt-2 w-full rounded-[18px] border border-[#ddd3bf] bg-[#fffdf8] px-4 py-3 text-sm text-text-main font-body outline-none transition-all focus:border-[#7f7a57] focus:ring-2 focus:ring-[#7f7a57]/15"
        />
      </div>

      <label className="mt-4 flex items-start gap-3 rounded-[18px] border border-[#ece3d4] bg-[#fffdf8] px-4 py-3">
        <input
          type="checkbox"
          checked={smsOptIn}
          onChange={(event) => setSmsOptIn(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-[#c9bda8] text-[#6d6b47] focus:ring-[#7f7a57]/30"
        />
        <span className="text-sm text-[#625e53] font-body leading-relaxed">
          Send SMS reminders for steps that have a follow-up date and reminder setting.
        </span>
      </label>

      <div className="mt-4 rounded-[18px] border border-[#ece3d4] bg-[#fffdf8] px-4 py-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
          <MessageSquareText size={13} />
          Delivery window
        </div>
        <p className="mt-2 text-sm text-[#625e53] font-body leading-relaxed">
          {helperMessage}
        </p>
        <p className="mt-2 text-xs text-[#8a8377] font-body">
          Local time zone: {timeZone}
        </p>
        {updatedAt && (
          <p className="mt-1 text-xs text-[#8a8377] font-body">
            Last updated {new Date(updatedAt).toLocaleString()}
          </p>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-[#a25547] font-body">
          {error}
        </p>
      )}

      {savedFlash && (
        <p className="mt-3 text-sm text-[#4f6d4e] font-body">
          SMS reminder settings saved.
        </p>
      )}

      <button
        type="button"
        disabled={isSaving || isFetching}
        onClick={async () => {
          setIsSaving(true);
          setError('');
          setSavedFlash(false);

          try {
            const response = await fetch('/api/reminders/sms-preferences', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                phoneNumber,
                smsOptIn,
                timeZone,
              }),
            });
            const payload = (await response.json()) as SmsPreferenceResponse;

            if (!response.ok) {
              setError(payload.error ?? 'Could not save SMS reminder settings.');
              return;
            }

            setPhoneNumber(payload.phoneNumber ?? '');
            setSmsOptIn(payload.smsOptIn ?? false);
            setDeliveryConfigured(payload.deliveryConfigured ?? false);
            setUpdatedAt(payload.updatedAt ?? null);
            setSavedFlash(true);
            window.setTimeout(() => setSavedFlash(false), 1800);
          } catch {
            setError('Could not save SMS reminder settings.');
          } finally {
            setIsSaving(false);
          }
        }}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#6d6b47] px-4 py-2.5 text-sm text-white font-body transition-colors hover:bg-[#5a583a] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Smartphone size={15} />}
        {isSaving ? 'Saving' : 'Save SMS settings'}
      </button>
    </div>
  );
}
