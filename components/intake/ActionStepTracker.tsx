'use client';

import { useState } from 'react';
import {
  BellRing,
  CalendarClock,
  CalendarPlus2,
  ChevronDown,
  ChevronUp,
  ClipboardPenLine,
  PhoneCall,
} from 'lucide-react';
import { createActionPlanEntry, getFollowUpState, getTrackerShouldStartExpanded } from '@/lib/actionPlanState';
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
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
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
  const shouldStartExpanded = getTrackerShouldStartExpanded(status, followUpState.tone, normalizedEntry);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || shouldStartExpanded);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const notePreview = normalizedEntry.notes?.trim()
    ? shortenText(normalizedEntry.notes.trim())
    : null;
  const lastContactLabel = normalizedEntry.lastContactDate
    ? formatFollowUpDate(normalizedEntry.lastContactDate)
    : 'Not saved yet';
  const nextFollowUpLabel = normalizedEntry.nextFollowUpDate
    ? formatFollowUpDate(normalizedEntry.nextFollowUpDate)
    : 'Not scheduled yet';
  const reminderLabel = normalizedEntry.nextFollowUpDate
    ? getReminderLeadDaysLabel(normalizedEntry.reminderLeadDays ?? null)
    : 'Add a follow-up first';

  return (
    <div className="mt-5 rounded-[24px] border border-[#e4dac8] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,244,237,0.95))] px-4 py-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#8a8377] font-body">
              Step tracker
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <div
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-body ${followUpToneClass[followUpState.tone]}`}
              >
                <CalendarClock size={12} className="mr-1.5" />
                {followUpState.label}
              </div>
              {notePreview && (
                <p className="text-xs text-[#8a8377] font-body">{notePreview}</p>
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          aria-expanded={isExpanded}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-[#ddd3bf] bg-white px-3 py-2 text-xs text-[#5a5549] font-body transition-colors hover:border-[#7f7a57] hover:text-[#504b40]"
        >
          {isExpanded ? 'Hide' : 'Open tracker'}
          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {/* Primary: two date pickers side by side */}
          <div className="grid gap-3 sm:grid-cols-2">
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
                onChange={(e) => onUpdate({ lastContactDate: e.target.value })}
                className="mt-3 w-full rounded-[18px] border border-[#e3dac9] bg-[#fffdf9] px-4 py-3 text-sm text-text-main font-body outline-none transition-all focus:border-[#7f7a57] focus:ring-2 focus:ring-[#7f7a57]/15"
              />
              <p className="mt-2 text-xs text-[#8a8377] font-body">Last call, email, or meeting.</p>
            </div>

            <div className="rounded-[20px] border border-[#e9dfcf] bg-white/85 px-4 py-4">
              <label
                htmlFor={`follow-up-${actionId}`}
                className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body"
              >
                <CalendarClock size={13} />
                Follow up by
              </label>
              <input
                id={`follow-up-${actionId}`}
                type="date"
                value={normalizedEntry.nextFollowUpDate ?? ''}
                onChange={(e) =>
                  onUpdate(
                    e.target.value
                      ? { nextFollowUpDate: e.target.value, reminderLeadDays: normalizedEntry.reminderLeadDays ?? 1 }
                      : { nextFollowUpDate: '', reminderLeadDays: null }
                  )
                }
                className="mt-3 w-full rounded-[18px] border border-[#e3dac9] bg-[#fffdf9] px-4 py-3 text-sm text-text-main font-body outline-none transition-all focus:border-[#7f7a57] focus:ring-2 focus:ring-[#7f7a57]/15"
              />
              <p className="mt-2 text-xs text-[#8a8377] font-body">When to check back on {actionTitle.toLowerCase()}.</p>
            </div>
          </div>

          {/* Secondary: notes */}
          <div className="rounded-[20px] border border-[#e9dfcf] bg-white/85 px-4 py-4">
            <label
              htmlFor={`notes-${actionId}`}
              className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body"
            >
              <ClipboardPenLine size={13} />
              Notes
            </label>
            <textarea
              id={`notes-${actionId}`}
              value={normalizedEntry.notes ?? ''}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              placeholder="e.g. Called Monday, waitlist is 4 months, needs referral faxed from pediatrician."
              className="mt-3 min-h-[96px] w-full resize-y rounded-[18px] border border-[#e3dac9] bg-[#fffdf9] px-4 py-3 text-sm text-text-main font-body outline-none transition-all placeholder:text-[#9b9487] focus:border-[#7f7a57] focus:ring-2 focus:ring-[#7f7a57]/15"
            />
          </div>

          {/* Advanced: reminder + calendar export (collapsed by default) */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-[#8a8377] font-body hover:text-[#5a5549] transition-colors"
            >
              <BellRing size={12} />
              {showAdvanced ? 'Hide reminder settings' : 'Set a reminder'}
              {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {showAdvanced && (
              <div className="mt-3 rounded-[20px] border border-[#e9dfcf] bg-white/85 px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex-1">
                    <label
                      htmlFor={`reminder-lead-${actionId}`}
                      className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body"
                    >
                      <BellRing size={13} />
                      Remind me
                    </label>
                    <select
                      id={`reminder-lead-${actionId}`}
                      value={normalizedEntry.reminderLeadDays === null ? 'none' : String(normalizedEntry.reminderLeadDays)}
                      disabled={!normalizedEntry.nextFollowUpDate}
                      onChange={(e) =>
                        onUpdate({
                          reminderLeadDays:
                            e.target.value === 'none'
                              ? null
                              : (Number(e.target.value) as Exclude<ReminderLeadDays, null>),
                        })
                      }
                      className="mt-3 w-full rounded-[18px] border border-[#e3dac9] bg-[#fffdf9] px-4 py-3 text-sm text-text-main font-body outline-none transition-all disabled:cursor-not-allowed disabled:bg-[#f5f0e6] disabled:text-[#9b9487] focus:border-[#7f7a57] focus:ring-2 focus:ring-[#7f7a57]/15"
                    >
                      {REMINDER_LEAD_DAY_OPTIONS.map((opt) => (
                        <option key={opt.value === null ? 'none' : opt.value} value={opt.value === null ? 'none' : opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-[#8a8377] font-body">
                      {normalizedEntry.nextFollowUpDate ? reminderLabel : 'Set a follow-up date first.'}
                    </p>
                  </div>
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}
