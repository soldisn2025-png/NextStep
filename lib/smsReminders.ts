import { formatFollowUpDate } from './reminders';

const DAY_IN_MS = 86_400_000;
const DEFAULT_SEND_HOUR = 9;

function parseDateString(dateValue: string) {
  const [year, month, day] = dateValue.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return Date.UTC(year, month - 1, day);
}

function getDatePartsInTimeZone(timeZone: string, referenceDate = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(referenceDate);
    const getPart = (type: string) =>
      parts.find((part) => part.type === type)?.value ?? '';

    return {
      year: Number(getPart('year')),
      month: Number(getPart('month')),
      day: Number(getPart('day')),
      hour: Number(getPart('hour')),
    };
  } catch {
    return null;
  }
}

export function normalizeUsPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, '');

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  if (/^\+1\d{10}$/.test(value.trim())) {
    return value.trim();
  }

  return null;
}

export function formatUsPhoneNumber(value: string) {
  const normalized = normalizeUsPhoneNumber(value);
  if (!normalized) {
    return value;
  }

  const digits = normalized.slice(2);
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function getDaysUntilInTimeZone(
  followUpDate: string,
  timeZone: string,
  referenceDate = new Date()
) {
  const followUpUtc = parseDateString(followUpDate);
  const parts = getDatePartsInTimeZone(timeZone, referenceDate);

  if (followUpUtc === null || !parts) {
    return null;
  }

  const todayUtc = Date.UTC(parts.year, parts.month - 1, parts.day);
  return Math.round((followUpUtc - todayUtc) / DAY_IN_MS);
}

export function shouldSendReminderThisHour(timeZone: string, referenceDate = new Date()) {
  const parts = getDatePartsInTimeZone(timeZone, referenceDate);
  if (!parts) {
    return false;
  }

  return parts.hour === DEFAULT_SEND_HOUR;
}

export function isSmsDeliveryConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
  );
}

export function getAppBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'https://nextstep-autism-pilot.vercel.app';
}

export function buildSmsReminderMessage(actionTitle: string, followUpDate: string, appUrl: string) {
  return `NextStep reminder: follow up on "${actionTitle}" by ${formatFollowUpDate(followUpDate)}. Review your notes and next action: ${appUrl}/intake`;
}

interface TwilioSendResult {
  sid: string;
}

export async function sendTwilioSms(to: string, body: string): Promise<TwilioSendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio SMS delivery is not configured.');
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: new URLSearchParams({
        To: to,
        From: fromNumber,
        Body: body,
      }),
      cache: 'no-store',
    }
  );

  const payload = (await response.json()) as { sid?: string; message?: string };
  if (!response.ok || !payload.sid) {
    throw new Error(payload.message ?? 'Twilio could not send the SMS reminder.');
  }

  return { sid: payload.sid };
}
