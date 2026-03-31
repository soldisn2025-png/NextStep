'use client';

import { getSupabaseBrowserClient } from './client';
import {
  parsePersistedPlanSnapshot,
  PersistedPlanSnapshot,
} from '@/lib/planSnapshot';

const PLAN_SNAPSHOT_TABLE = 'user_plan_snapshots';

interface PlanSnapshotRow {
  plan_state: unknown;
  plan_updated_at: string;
}

export async function fetchRemotePlanSnapshot(userId: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from(PLAN_SNAPSHOT_TABLE)
    .select('plan_state, plan_updated_at')
    .eq('user_id', userId)
    .maybeSingle<PlanSnapshotRow>();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const snapshot = parsePersistedPlanSnapshot(data.plan_state);

  return {
    ...snapshot,
    planUpdatedAt: data.plan_updated_at ?? snapshot.planUpdatedAt,
  };
}

export async function saveRemotePlanSnapshot(
  userId: string,
  snapshot: PersistedPlanSnapshot
) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from(PLAN_SNAPSHOT_TABLE).upsert(
    {
      user_id: userId,
      plan_state: snapshot,
      plan_updated_at: snapshot.planUpdatedAt || new Date().toISOString(),
    },
    {
      onConflict: 'user_id',
    }
  );

  if (error) {
    throw error;
  }
}
