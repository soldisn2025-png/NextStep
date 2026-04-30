import {
  ActionExecutionDraft,
  ActionExecutionLogEntry,
  ActionPlanProgressEntry,
  ActionPlanStatus,
  ReminderLeadDays,
} from './types';

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
    reminderLeadDays: updates.reminderLeadDays ?? previous?.reminderLeadDays ?? null,
    savedDrafts: updates.savedDrafts ?? previous?.savedDrafts ?? [],
    executionLog: updates.executionLog ?? previous?.executionLog ?? [],
  };
}

function parseReminderLeadDays(value: unknown): ReminderLeadDays {
  if (value === 0 || value === 1 || value === 3 || value === 7) {
    return value;
  }

  return null;
}

function isActionAssistantMode(value: unknown) {
  return (
    value === 'draft-email' ||
    value === 'call-script' ||
    value === 'meeting-questions' ||
    value === 'summarize-notes'
  );
}

function isExecutionLogType(value: unknown) {
  return (
    value === 'email-sent' ||
    value === 'call-made' ||
    value === 'voicemail-left' ||
    value === 'meeting-booked' ||
    value === 'form-submitted'
  );
}

function parseExecutionDrafts(value: unknown): ActionExecutionDraft[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((draft) => {
    if (!draft || typeof draft !== 'object') {
      return [];
    }

    const record = draft as Record<string, unknown>;
    if (
      typeof record.id !== 'string' ||
      typeof record.content !== 'string' ||
      !isActionAssistantMode(record.mode)
    ) {
      return [];
    }

    return [
      {
        id: record.id,
        mode: record.mode,
        content: record.content,
        savedAt:
          typeof record.savedAt === 'string' && record.savedAt.length > 0
            ? record.savedAt
            : new Date().toISOString(),
        updatedAt:
          typeof record.updatedAt === 'string' && record.updatedAt.length > 0
            ? record.updatedAt
            : typeof record.savedAt === 'string' && record.savedAt.length > 0
              ? record.savedAt
              : new Date().toISOString(),
      },
    ];
  });
}

function parseExecutionLog(value: unknown): ActionExecutionLogEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') {
      return [];
    }

    const record = item as Record<string, unknown>;
    if (
      typeof record.id !== 'string' ||
      !isExecutionLogType(record.type) ||
      typeof record.createdAt !== 'string'
    ) {
      return [];
    }

    return [
      {
        id: record.id,
        type: record.type,
        note: typeof record.note === 'string' ? record.note : '',
        createdAt: record.createdAt,
      },
    ];
  });
}

export function parseStoredProgressEntry(
  entry: Record<string, unknown> | null | undefined
): ActionPlanProgressEntry | null {
  if (!entry) {
    return null;
  }

  const status = entry.status;
  if (
    status !== 'not-started' &&
    status !== 'in-progress' &&
    status !== 'done' &&
    status !== 'skipped'
  ) {
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
    reminderLeadDays: parseReminderLeadDays(entry.reminderLeadDays),
    savedDrafts: parseExecutionDrafts(entry.savedDrafts),
    executionLog: parseExecutionLog(entry.executionLog),
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

  if (status === 'skipped') {
    return {
      label: 'Step skipped for now',
      tone: 'neutral',
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

export function getTrackerShouldStartExpanded(
  status: ActionPlanStatus,
  tone: 'neutral' | 'success' | 'warning' | 'danger',
  entry: ActionPlanProgressEntry
): boolean {
  if (status === 'in-progress') {
    return true;
  }

  if (tone === 'warning' || tone === 'danger') {
    return true;
  }

  return false;
}
