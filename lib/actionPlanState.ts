import { ActionPlanProgressEntry, ActionPlanStatus } from './types';

const DAY_IN_MS = 86_400_000;

export function formatRelativeUpdate(updatedAt: string) {
  const diffMs = Date.now() - new Date(updatedAt).getTime();

  if (!Number.isFinite(diffMs) || diffMs < 60_000) {
    return 'Updated just now';
  }

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) {
    return `Updated ${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Updated ${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `Updated ${days}d ago`;
}

export function createActionPlanEntry(
  previous: ActionPlanProgressEntry | undefined,
  updates: Partial<ActionPlanProgressEntry>
): ActionPlanProgressEntry {
  return {
    status: updates.status ?? previous?.status ?? 'not-started',
    updatedAt: updates.updatedAt ?? previous?.updatedAt ?? '',
    notes: updates.notes ?? previous?.notes ?? '',
    lastContactDate: updates.lastContactDate ?? previous?.lastContactDate ?? '',
    nextFollowUpDate: updates.nextFollowUpDate ?? previous?.nextFollowUpDate ?? '',
  };
}

export function parseStoredProgressEntry(
  entry: Record<string, unknown> | null | undefined
): ActionPlanProgressEntry | null {
  if (!entry) {
    return null;
  }

  const status = entry.status;
  if (status !== 'not-started' && status !== 'in-progress' && status !== 'done') {
    return null;
  }

  return {
    status,
    updatedAt:
      typeof entry.updatedAt === 'string' && entry.updatedAt.length > 0
        ? entry.updatedAt
        : new Date().toISOString(),
    notes: typeof entry.notes === 'string' ? entry.notes : '',
    lastContactDate: typeof entry.lastContactDate === 'string' ? entry.lastContactDate : '',
    nextFollowUpDate: typeof entry.nextFollowUpDate === 'string' ? entry.nextFollowUpDate : '',
  };
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function getDaysUntil(dateValue: string) {
  const followUpDate = new Date(dateValue);
  if (Number.isNaN(followUpDate.getTime())) {
    return null;
  }

  followUpDate.setHours(0, 0, 0, 0);
  const diff = followUpDate.getTime() - startOfToday().getTime();
  return Math.round(diff / DAY_IN_MS);
}

export function getFollowUpState(
  nextFollowUpDate: string | undefined,
  status: ActionPlanStatus
): {
  label: string;
  tone: 'neutral' | 'success' | 'warning' | 'danger';
} {
  if (status === 'done') {
    return {
      label: 'Step completed',
      tone: 'success',
    };
  }

  if (!nextFollowUpDate) {
    return {
      label: 'No follow-up date yet',
      tone: 'neutral',
    };
  }

  const daysUntil = getDaysUntil(nextFollowUpDate);
  if (daysUntil === null) {
    return {
      label: 'No follow-up date yet',
      tone: 'neutral',
    };
  }

  if (daysUntil < 0) {
    return {
      label: `Follow-up overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? '' : 's'}`,
      tone: 'danger',
    };
  }

  if (daysUntil === 0) {
    return {
      label: 'Follow-up due today',
      tone: 'warning',
    };
  }

  if (daysUntil <= 7) {
    return {
      label: `Follow-up due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`,
      tone: 'warning',
    };
  }

  return {
    label: `Next follow-up in ${daysUntil} days`,
    tone: 'success',
  };
}

export function getWeeklyCheckInState(checkedInAt?: string | null) {
  if (!checkedInAt) {
    return {
      label: 'No weekly check-in saved yet',
      needsAttention: true,
      daysSince: null as number | null,
    };
  }

  const updatedAt = new Date(checkedInAt);
  if (Number.isNaN(updatedAt.getTime())) {
    return {
      label: 'No weekly check-in saved yet',
      needsAttention: true,
      daysSince: null as number | null,
    };
  }

  const diffMs = Date.now() - updatedAt.getTime();
  const daysSince = Math.max(0, Math.floor(diffMs / DAY_IN_MS));

  if (daysSince >= 7) {
    return {
      label: `Last weekly check-in was ${daysSince} days ago`,
      needsAttention: true,
      daysSince,
    };
  }

  return {
    label: daysSince === 0 ? 'Checked in today' : `Checked in ${daysSince} days ago`,
    needsAttention: false,
    daysSince,
  };
}
