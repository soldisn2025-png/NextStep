import { NextRequest, NextResponse } from 'next/server';
import { parsePersistedPlanSnapshot } from '@/lib/planSnapshot';
import { getRecommendations } from '@/lib/rulesEngine';
import {
  buildSmsReminderMessage,
  getDaysUntilInTimeZone,
  isSmsDeliveryConfigured,
  sendTwilioSms,
  shouldSendReminderThisHour,
} from '@/lib/smsReminders';
import { buildAppUrl } from '@/lib/appUrl';
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PREFERENCE_TABLE = 'user_notification_preferences';
const SNAPSHOT_TABLE = 'user_plan_snapshots';
const DELIVERY_LOG_TABLE = 'reminder_delivery_log';

interface PreferenceRow {
  user_id: string;
  sms_phone: string | null;
  sms_opt_in: boolean;
  time_zone: string;
}

interface SnapshotRow {
  user_id: string;
  plan_state: unknown;
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.REMINDER_CRON_SECRET;
  if (!secret) {
    return false;
  }

  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured() || !isSmsDeliveryConfigured()) {
    return NextResponse.json(
      {
        status: 'skipped',
        reason: 'SMS delivery is not configured yet.',
      },
      { status: 200 }
    );
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Admin client unavailable.' }, { status: 500 });
  }
  const admin = supabase as any;

  const { data: preferences, error: preferenceError } = await admin
    .from(PREFERENCE_TABLE)
    .select('user_id, sms_phone, sms_opt_in, time_zone')
    .eq('sms_opt_in', true)
    .not('sms_phone', 'is', null);

  if (preferenceError) {
    return NextResponse.json(
      { error: 'Could not load SMS reminder preferences.' },
      { status: 500 }
    );
  }

  if (!preferences || preferences.length === 0) {
    return NextResponse.json(
      { status: 'ok', scannedUsers: 0, queued: 0, sent: 0, failed: 0 },
      { status: 200 }
    );
  }

  const typedPreferences = preferences as PreferenceRow[];
  const userIds = typedPreferences.map((preference) => preference.user_id);
  const { data: snapshotRows, error: snapshotError } = await admin
    .from(SNAPSHOT_TABLE)
    .select('user_id, plan_state')
    .in('user_id', userIds);

  if (snapshotError) {
    return NextResponse.json(
      { error: 'Could not load synced plan snapshots.' },
      { status: 500 }
    );
  }

  const typedSnapshotRows = (snapshotRows ?? []) as SnapshotRow[];
  const snapshotMap = new Map(
    typedSnapshotRows.map((row) => [row.user_id, row.plan_state])
  );
  const vercelFallback = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://nextstep-autism-pilot.vercel.app';
  const planUrl = buildAppUrl('/intake', vercelFallback);
  let queuedCount = 0;
  let sentCount = 0;
  let failedCount = 0;

  for (const preference of typedPreferences) {
    if (!preference.sms_phone || !shouldSendReminderThisHour(preference.time_zone)) {
      continue;
    }

    const snapshotValue = snapshotMap.get(preference.user_id);
    if (!snapshotValue) {
      continue;
    }

    const snapshot = parsePersistedPlanSnapshot(snapshotValue);
    const recommendations = getRecommendations(snapshot.answers, snapshot.locale);
    const recommendationMap = new Map(recommendations.map((item) => [item.id, item]));

    for (const [actionId, entry] of Object.entries(snapshot.progress)) {
      const reminderLeadDays = entry.reminderLeadDays;

      if (
        !entry.nextFollowUpDate ||
        reminderLeadDays === null ||
        reminderLeadDays === undefined ||
        entry.status === 'done' ||
        entry.status === 'skipped'
      ) {
        continue;
      }

      const action = recommendationMap.get(actionId);
      if (!action) {
        continue;
      }

      const daysUntil = getDaysUntilInTimeZone(
        entry.nextFollowUpDate,
        preference.time_zone
      );

      if (
        daysUntil === null ||
        daysUntil < 0 ||
        daysUntil > reminderLeadDays
      ) {
        continue;
      }

      const { data: insertedLog, error: insertError } = await admin
        .from(DELIVERY_LOG_TABLE)
        .insert({
          user_id: preference.user_id,
          channel: 'sms',
          action_id: actionId,
          follow_up_date: entry.nextFollowUpDate,
          reminder_lead_days: reminderLeadDays,
          status: 'queued',
          sent_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (insertError) {
        if ((insertError as { code?: string }).code === '23505') {
          continue;
        }

        failedCount += 1;
        continue;
      }

      queuedCount += 1;

      try {
        const smsBody = buildSmsReminderMessage(
          action.title,
          entry.nextFollowUpDate,
          planUrl
        );
        const delivery = await sendTwilioSms(preference.sms_phone, smsBody);

        await admin
          .from(DELIVERY_LOG_TABLE)
          .update({
            status: 'sent',
            provider_message_id: delivery.sid,
            error_message: null,
          })
          .eq('id', insertedLog.id);

        sentCount += 1;
      } catch (error) {
        await admin
          .from(DELIVERY_LOG_TABLE)
          .update({
            status: 'failed',
            error_message:
              error instanceof Error ? error.message : 'SMS reminder failed.',
          })
          .eq('id', insertedLog.id);

        failedCount += 1;
      }
    }
  }

  return NextResponse.json(
    {
      status: 'ok',
      scannedUsers: preferences.length,
      queued: queuedCount,
      sent: sentCount,
      failed: failedCount,
    },
    { status: 200 }
  );
}
