import { getDaysUntil } from './actionPlanState';
import {
  ActionPlanProgressEntry,
  RecommendedAction,
  ReminderLeadDays,
} from './types';

export const REMINDER_LEAD_DAY_OPTIONS: Array<{
  value: ReminderLeadDays;
  label: string;
}> = [
  { value: null, label: 'In-app only' },
  { value: 0, label: 'Morning of' },
  { value: 1, label: '1 day before' },
  { value: 3, label: '3 days before' },
  { value: 7, label: '1 week before' },
];

export interface ReminderItem {
  action: RecommendedAction;
  entry: ActionPlanProgressEntry;
  daysUntil: number;
  reminderIsDue: boolean;
  dueState: 'overdue' | 'today' | 'soon' | 'later';
  followUpDateLabel: string;
}

export function getReminderLeadDaysLabel(value: ReminderLeadDays) {
  return REMINDER_LEAD_DAY_OPTIONS.find((option) => option.value === value)?.label ?? 'In-app only';
}

export function formatFollowUpDate(dateValue: string) {
  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function buildReminderItems(
  entries: Array<{ action: RecommendedAction; entry: ActionPlanProgressEntry }>
) {
  return entries
    .flatMap<ReminderItem>((item) => {
      if (!item.entry.nextFollowUpDate) {
        return [];
      }

      const daysUntil = getDaysUntil(item.entry.nextFollowUpDate);
      if (daysUntil === null) {
        return [];
      }

      const reminderLeadDays = item.entry.reminderLeadDays ?? null;
      const reminderIsDue =
        reminderLeadDays !== null ? daysUntil <= reminderLeadDays : false;

      return [
        {
          action: item.action,
          entry: item.entry,
          daysUntil,
          reminderIsDue,
          dueState:
            daysUntil < 0
              ? 'overdue'
              : daysUntil === 0
                ? 'today'
                : daysUntil <= 7
                  ? 'soon'
                  : 'later',
          followUpDateLabel: formatFollowUpDate(item.entry.nextFollowUpDate),
        },
      ];
    })
    .sort((a, b) => {
      if (a.daysUntil !== b.daysUntil) {
        return a.daysUntil - b.daysUntil;
      }

      return a.action.title.localeCompare(b.action.title);
    });
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function formatFloatingDate(dateValue: string, hour: number, minute = 0): string | null {
  const [year, month, day] = dateValue.split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  const pad = (value: number) => value.toString().padStart(2, '0');

  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

function buildAlarmSection(reminderLeadDays: ReminderLeadDays) {
  if (reminderLeadDays === null) {
    return '';
  }

  const trigger = reminderLeadDays === 0 ? '-PT1H' : `-P${reminderLeadDays}D`;

  return [
    'BEGIN:VALARM',
    `TRIGGER:${trigger}`,
    'ACTION:DISPLAY',
    'DESCRIPTION:NextStep follow-up reminder',
    'END:VALARM',
  ].join('\r\n');
}

export function buildReminderIcs(
  action: RecommendedAction,
  entry: ActionPlanProgressEntry
) {
  if (!entry.nextFollowUpDate) {
    return null;
  }

  const now = new Date();
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const start = formatFloatingDate(entry.nextFollowUpDate, 9);
  const end = formatFloatingDate(entry.nextFollowUpDate, 9, 30);

  if (!start || !end) {
    return null;
  }

  const reminderLabel = getReminderLeadDaysLabel(entry.reminderLeadDays ?? null);
  const notes = entry.notes?.trim()
    ? `Notes: ${entry.notes.trim()}`
    : 'Notes: review the step details in NextStep before reaching out.';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NextStep//FollowUpReminder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:nextstep-${action.id}-${entry.nextFollowUpDate}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcsText(`Follow up: ${action.title}`)}`,
    `DESCRIPTION:${escapeIcsText(`${action.description}\n\n${notes}\nReminder setting: ${reminderLabel}.`)}`,
    buildAlarmSection(entry.reminderLeadDays ?? null),
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

export function downloadReminderCalendarFile(
  action: RecommendedAction,
  entry: ActionPlanProgressEntry
) {
  const content = buildReminderIcs(action, entry);
  if (!content) {
    return;
  }

  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `nextstep-${action.id}-follow-up.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
