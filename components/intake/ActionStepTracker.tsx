'use client';

import { useEffect, useState } from 'react';
import {
  BellRing,
  CalendarClock,
  CalendarPlus2,
  ChevronDown,
  ChevronUp,
  ClipboardPenLine,
  PhoneCall,
} from 'lucide-react';
import { createActionPlanEntry, getFollowUpState } from '@/lib/actionPlanState';
import {
  downloadReminderCalendarFile,
  formatFollowUpDate,
  getReminderLeadDaysLabel,
  REMINDER_LEAD_DAY_OPTIONS,
} from '@/lib/reminders';
import { ActionPlanProgressEntry, ActionPlanStatus, RecommendedAction, ReminderLeadDays } from '@/lib/types';

interface ActionStepTrackerProps {
  actionId: string;
  action: RecommendedAction;
  actionTitle: string;
  entry?: ActionPlanProgressEntry;
  status: ActionPlanStatus;
  defaultExpanded?: boolean;
  onUpdate: (updates: Partial<ActionPlanProgressEntry>) => void;
}

const followUpToneClass = {
  neutral: 'border-[#e5dccb] bg-white text-[#6f6a5b]',
  success: 'border-[#d5e4cc] bg-[#eff7e9] text-[#4f6d4e]',
  warning: 'border-[#f1ddb4] bg-[#fff7e7] text-[#95611f]',
  danger: 'border-[#f0d0c8] bg-[#fff2ef] text-[#a25547]',
};

function shortenText(value: string, maxLength = 120) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
}

function getTrackerShouldStartExpanded(
  status: ActionPlanStatus,
  tone: keyof typeof followUpToneClass,
  entry: ActionPlanProgressEntry
) {
  if (status === 'in-progress') {
    return true;
  }

  if (tone === 'warning' || tone === 'danger') {
    return true;
  }

  return !entry.notes?.trim() && !entry.lastContactDate && !entry.nextFollowUpDate;
}

export default function ActionStepTracker({
  actionId,
  action,
  actionTitle,
  entry,
  status,
  defaultExpanded = false,
  onUpdate,
}: ActionStepTrackerProps) {
  const normalizedEntry = createActionPlanEntry(entry, {});
  const followUpState = getFollowUpState(normalizedEntry.nextFollowUpDate, status);
  const shouldStartExpanded = getTrackerShouldStartExpanded(
    status,
    followUpState.tone,
    normalizedEntry
  );
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || shouldStartExpanded);
  const notePreview = normalizedEntry.notes?.trim()
    ? shortenText(normalizedEntry.notes.trim())
    : 'No notes saved yet.';
  const lastContactLabel = normalizedEntry.lastContactDate
    ? formatFollowUpDate(normalizedEntry.lastContactDate)
    : 'Not saved yet';
  const nextFollowUpLabel = normalizedEntry.nextFollowUpDate
    ? formatFollowUpDate(normalizedEntry.nextFollowUpDate)
    : 'Not scheduled yet';
  const reminderLabel = normalizedEntry.nextFollowUpDate
    ? getReminderLeadDaysLabel(normalizedEntry.reminderLeadDays ?? null)
    : 'Add a follow-up first';

  useEffect(() => {
    if (defaultExpanded || shouldStartExpanded) {
      setIsExpanded(true);
    }
  }, [defaultExpanded, shouldStartExpanded]);

  return (
    <div className="mt-5 rounded-[24px] border border-[#e4dac8] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,244,237,0.95))] px-4 py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#8a8377] font-body">
            Step tracker
          </p>
          <h4 className="mt-2 font-heading text-xl text-text-main">
            Keep the operational details nearby, not always open.
          </h4>
          <p className="mt-2 text-sm text-[#625e53] font-body leading-relaxed">
            Save what happened on {actionTitle.toLowerCase()}, then open the full tracker only when you need to edit dates, notes, or reminder settings.
          </p>
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          <div
            className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-body ${followUpToneClass[followUpState.tone]}`}
          >
            <CalendarClock size={13} className="mr-1.5" />
            {followUpState.label}
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            aria-expanded={isExpanded}
            className="inline-flex items-center gap-2 rounded-full border border-[#ddd3bf] bg-white px-4 py-2 text-sm text-[#5a5549] font-body transition-colors hover:border-[#7f7a57] hover:text-[#504b40]"
          >
            {isExpanded ? 'Hide tracker' : 'Open tracker'}
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[0.95fr_0.95fr_0.9fr]">
        <div className="rounded-[20px] border border-[#e9dfcf] bg-white/85 px-4 py-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
            <PhoneCall size={13} />
            Last contact
          </div>
          <p className="mt-3 text-sm text-text-main font-body">{lastContactLabel}</p>
        </div>

        <div className="rounded-[20px] border border-[#e9dfcf] bg-white/85 px-4 py-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
            <CalendarClock size={13} />
            Next follow-up
          </div>
          <p className="mt-3 text-sm text-text-main font-body">{nextFollowUpLabel}</p>
          <p className="mt-2 text-xs text-[#8a8377] font-body">
            Reminder: {reminderLabel}
          </p>
        </div>

        <div className="rounded-[20px] border border-[#e9dfcf] bg-white/85 px-4 py-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
            <ClipboardPenLine size={13} />
            Notes preview
          </div>
          <p className="mt-3 text-sm text-[#625e53] font-body leading-relaxed">
            {notePreview}
          </p>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[20px] border border-[#e9dfcf] bg-white/85 px-4 py-4">
            <label
              htmlFor={`notes-${actionId}`}
              className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body"
            >
              <ClipboardPenLine size={13} />
              Notes for your next touchpoint
            </label>
            <textarea
              id={`notes-${actionId}`}
              value={normalizedEntry.notes ?? ''}
              onChange={(event) => onUpdate({ notes: event.target.value })}
              placeholder="Example: Called on Monday, waitlist is 4 months, needs referral faxed from pediatrician."
              className="mt-3 min-h-[120px] w-full resize-y rounded-[18px] border border-[#e3dac9] bg-[#fffdf9] px-4 py-3 text-sm text-text-main font-body outline-none transition-all placeholder:text-[#9b9487] focus:border-[#7f7a57] focus:ring-2 focus:ring-[#7f7a57]/15"
            />
          </div>

          <div className="grid gap-3">
            <div className="rounded-[20px] border border-[#e9dfcf] bg-white/85 px-4 py-4">
              <label
                htmlFor={`last-contact-${actionId}`}
                className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body"
              >
                <PhoneCall size={13} />
                Last contact
              </label>
              <input
                id={`last-contact-${actionId}`}
                type="date"
                value={normalizedEntry.lastContactDate ?? ''}
                onChange={(event) => onUpdate({ lastContactDate: event.target.value })}
                className="mt-3 w-full rounded-[18px] border border-[#e3dac9] bg-[#fffdf9] px-4 py-3 text-sm text-text-main font-body outline-none transition-all focus:border-[#7f7a57] focus:ring-2 focus:ring-[#7f7a57]/15"
              />
              <p className="mt-2 text-xs text-[#8a8377] font-body">
                Save the last call, email, or meeting date.
              </p>
            </div>

            <div className="rounded-[20px] border border-[#e9dfcf] bg-white/85 px-4 py-4">
              <label
                htmlFor={`follow-up-${actionId}`}
                className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body"
              >
                <CalendarClock size={13} />
                Next follow-up
              </label>
              <input
                id={`follow-up-${actionId}`}
                type="date"
                value={normalizedEntry.nextFollowUpDate ?? ''}
                onChange={(event) =>
                  onUpdate(
                    event.target.value
                      ? {
                          nextFollowUpDate: event.target.value,
                          reminderLeadDays:
                            normalizedEntry.reminderLeadDays ?? 1,
                        }
                      : {
                          nextFollowUpDate: '',
                          reminderLeadDays: null,
                        }
                  )
                }
                className="mt-3 w-full rounded-[18px] border border-[#e3dac9] bg-[#fffdf9] px-4 py-3 text-sm text-text-main font-body outline-none transition-all focus:border-[#7f7a57] focus:ring-2 focus:ring-[#7f7a57]/15"
              />
              <p className="mt-2 text-xs text-[#8a8377] font-body">
                This gives the dashboard a concrete reason to pull you back in.
              </p>
            </div>

            <div className="rounded-[20px] border border-[#e9dfcf] bg-white/85 px-4 py-4">
              <label
                htmlFor={`reminder-lead-${actionId}`}
                className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body"
              >
                <BellRing size={13} />
                Reminder setting
              </label>
              <select
                id={`reminder-lead-${actionId}`}
                value={
                  normalizedEntry.reminderLeadDays === null
                    ? 'none'
                    : String(normalizedEntry.reminderLeadDays)
                }
                disabled={!normalizedEntry.nextFollowUpDate}
                onChange={(event) =>
                  onUpdate({
                    reminderLeadDays:
                      event.target.value === 'none'
                        ? null
                        : (Number(event.target.value) as Exclude<ReminderLeadDays, null>),
                  })
                }
                className="mt-3 w-full rounded-[18px] border border-[#e3dac9] bg-[#fffdf9] px-4 py-3 text-sm text-text-main font-body outline-none transition-all disabled:cursor-not-allowed disabled:bg-[#f5f0e6] disabled:text-[#9b9487] focus:border-[#7f7a57] focus:ring-2 focus:ring-[#7f7a57]/15"
              >
                {REMINDER_LEAD_DAY_OPTIONS.map((option) => (
                  <option
                    key={option.value === null ? 'none' : option.value}
                    value={option.value === null ? 'none' : option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-[#8a8377] font-body">
                  {normalizedEntry.nextFollowUpDate
                    ? 'Export this follow-up to your calendar with the selected reminder.'
                    : 'Add a follow-up date first to enable calendar or browser reminders.'}
                </p>
                <button
                  type="button"
                  disabled={!normalizedEntry.nextFollowUpDate}
                  onClick={() => downloadReminderCalendarFile(action, normalizedEntry)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#ddd3bf] bg-white px-3 py-2 text-xs text-[#5a5549] font-body transition-colors hover:border-[#7f7a57] hover:text-[#504b40] disabled:cursor-not-allowed disabled:border-[#e5dccb] disabled:bg-[#f8f3ea] disabled:text-[#a49b8d]"
                >
                  <CalendarPlus2 size={13} />
                  Add to calendar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
