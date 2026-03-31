'use client';

import { CalendarClock, ClipboardPenLine, PhoneCall } from 'lucide-react';
import { createActionPlanEntry, getFollowUpState } from '@/lib/actionPlanState';
import { ActionPlanProgressEntry, ActionPlanStatus } from '@/lib/types';

interface ActionStepTrackerProps {
  actionId: string;
  actionTitle: string;
  entry?: ActionPlanProgressEntry;
  status: ActionPlanStatus;
  onUpdate: (updates: Partial<ActionPlanProgressEntry>) => void;
}

const followUpToneClass = {
  neutral: 'border-[#e5dccb] bg-white text-[#6f6a5b]',
  success: 'border-[#d5e4cc] bg-[#eff7e9] text-[#4f6d4e]',
  warning: 'border-[#f1ddb4] bg-[#fff7e7] text-[#95611f]',
  danger: 'border-[#f0d0c8] bg-[#fff2ef] text-[#a25547]',
};

export default function ActionStepTracker({
  actionId,
  actionTitle,
  entry,
  status,
  onUpdate,
}: ActionStepTrackerProps) {
  const normalizedEntry = createActionPlanEntry(entry, {});
  const followUpState = getFollowUpState(normalizedEntry.nextFollowUpDate, status);

  return (
    <div className="mt-5 rounded-[24px] border border-[#e4dac8] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,244,237,0.95))] px-4 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#8a8377] font-body">
            Keep this step moving
          </p>
          <h4 className="mt-2 font-heading text-xl text-text-main">Track calls, notes, and follow-ups</h4>
          <p className="mt-2 text-sm text-[#625e53] font-body leading-relaxed">
            Use this space to capture what happened on {actionTitle.toLowerCase()} so you do not restart from memory next week.
          </p>
        </div>
        <div
          className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-body ${followUpToneClass[followUpState.tone]}`}
        >
          <CalendarClock size={13} className="mr-1.5" />
          {followUpState.label}
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
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
            className="mt-3 min-h-[132px] w-full resize-y rounded-[18px] border border-[#e3dac9] bg-[#fffdf9] px-4 py-3 text-sm text-text-main font-body outline-none transition-all placeholder:text-[#9b9487] focus:border-[#7f7a57] focus:ring-2 focus:ring-[#7f7a57]/15"
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
              onChange={(event) => onUpdate({ nextFollowUpDate: event.target.value })}
              className="mt-3 w-full rounded-[18px] border border-[#e3dac9] bg-[#fffdf9] px-4 py-3 text-sm text-text-main font-body outline-none transition-all focus:border-[#7f7a57] focus:ring-2 focus:ring-[#7f7a57]/15"
            />
            <p className="mt-2 text-xs text-[#8a8377] font-body">
              This gives the dashboard a concrete reason to pull you back in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
