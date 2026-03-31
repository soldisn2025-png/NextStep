import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import {
  formatUsPhoneNumber,
  isSmsDeliveryConfigured,
  normalizeUsPhoneNumber,
} from '@/lib/smsReminders';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TABLE_NAME = 'user_notification_preferences';

interface SmsPreferencePayload {
  phoneNumber?: string;
  smsOptIn?: boolean;
  timeZone?: string;
}

function getDefaultResponse(timeZone = 'America/New_York') {
  return {
    phoneNumber: '',
    phoneNumberLabel: '',
    smsOptIn: false,
    timeZone,
    updatedAt: null as string | null,
    deliveryConfigured: isSmsDeliveryConfigured(),
  };
}

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase auth is not configured in this deployment.' },
      { status: 503 }
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Sign in to manage SMS reminders.' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('sms_phone, sms_opt_in, time_zone, updated_at')
    .eq('user_id', user.id)
    .maybeSingle<{
      sms_phone: string | null;
      sms_opt_in: boolean;
      time_zone: string;
      updated_at: string;
    }>();

  if (error) {
    return NextResponse.json(
      { error: 'SMS reminder preferences are unavailable right now.' },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(getDefaultResponse(), { status: 200 });
  }

  return NextResponse.json(
    {
      phoneNumber: data.sms_phone ?? '',
      phoneNumberLabel: data.sms_phone ? formatUsPhoneNumber(data.sms_phone) : '',
      smsOptIn: data.sms_opt_in,
      timeZone: data.time_zone,
      updatedAt: data.updated_at,
      deliveryConfigured: isSmsDeliveryConfigured(),
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase auth is not configured in this deployment.' },
      { status: 503 }
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Sign in to manage SMS reminders.' }, { status: 401 });
  }

  let body: SmsPreferencePayload;
  try {
    body = (await request.json()) as SmsPreferencePayload;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const smsOptIn = body.smsOptIn === true;
  const timeZone =
    typeof body.timeZone === 'string' && body.timeZone.trim().length > 0
      ? body.timeZone.trim().slice(0, 80)
      : 'America/New_York';
  const normalizedPhone = normalizeUsPhoneNumber(body.phoneNumber ?? '');

  if (smsOptIn && !normalizedPhone) {
    return NextResponse.json(
      { error: 'Enter a valid US mobile number to enable SMS reminders.' },
      { status: 400 }
    );
  }

  const payload = {
    user_id: user.id,
    sms_phone: normalizedPhone,
    sms_opt_in: smsOptIn && Boolean(normalizedPhone),
    time_zone: timeZone,
    sms_opted_in_at: smsOptIn && normalizedPhone ? new Date().toISOString() : null,
  };

  const { error } = await supabase.from(TABLE_NAME).upsert(payload, {
    onConflict: 'user_id',
  });

  if (error) {
    return NextResponse.json(
      { error: 'SMS reminder preferences could not be saved.' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      phoneNumber: payload.sms_phone ?? '',
      phoneNumberLabel: payload.sms_phone ? formatUsPhoneNumber(payload.sms_phone) : '',
      smsOptIn: payload.sms_opt_in,
      timeZone: payload.time_zone,
      updatedAt: new Date().toISOString(),
      deliveryConfigured: isSmsDeliveryConfigured(),
    },
    { status: 200 }
  );
}
