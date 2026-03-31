import {
  ActionAssistantMode,
  ActionExecutionDraft,
  ActionExecutionLogEntry,
  ExecutionLogType,
} from './types';

export const EXECUTION_LOG_META: Record<
  ExecutionLogType,
  { label: string; toneClass: string }
> = {
  'email-sent': {
    label: 'Email sent',
    toneClass: 'border-[#d6e3f8] bg-[#edf4ff] text-[#48607f]',
  },
  'call-made': {
    label: 'Call made',
    toneClass: 'border-[#f0dcc0] bg-[#fff7e8] text-[#95611f]',
  },
  'voicemail-left': {
    label: 'Voicemail left',
    toneClass: 'border-[#efe3c8] bg-[#faf3e5] text-[#7f6a2c]',
  },
  'meeting-booked': {
    label: 'Meeting booked',
    toneClass: 'border-[#d4e4c8] bg-[#edf6e7] text-[#4f6d4e]',
  },
  'form-submitted': {
    label: 'Form submitted',
    toneClass: 'border-[#ddd3fb] bg-[#f4efff] text-[#5e5585]',
  },
};

export function getActionAssistantModeLabel(mode: ActionAssistantMode) {
  switch (mode) {
    case 'draft-email':
      return 'Draft email';
    case 'call-script':
      return 'Call script';
    case 'meeting-questions':
      return 'Meeting questions';
    case 'summarize-notes':
      return 'Summary';
    default:
      return 'Saved draft';
  }
}

export function formatExecutionTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Saved recently';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function createDraftId(mode: ActionAssistantMode) {
  return `${mode}-${Date.now()}`;
}

export function createExecutionLogEntry(
  type: ExecutionLogType,
  note: string
): ActionExecutionLogEntry {
  return {
    id: `${type}-${Date.now()}`,
    type,
    note,
    createdAt: new Date().toISOString(),
  };
}

export function upsertExecutionDraft(
  currentDrafts: ActionExecutionDraft[],
  nextDraft: ActionExecutionDraft
) {
  const existingIndex = currentDrafts.findIndex((draft) => draft.mode === nextDraft.mode);

  if (existingIndex === -1) {
    return [nextDraft, ...currentDrafts];
  }

  return currentDrafts.map((draft, index) =>
    index === existingIndex ? nextDraft : draft
  );
}
