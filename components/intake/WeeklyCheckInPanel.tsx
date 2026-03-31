'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarRange, CheckCheck, ListTodo, RefreshCcw } from 'lucide-react';
import { getWeeklyCheckInState } from '@/lib/actionPlanState';
import { RecommendedAction, WeeklyCheckInEntry } from '@/lib/types';

interface WeeklyCheckInPanelProps {
  className?: string;
  checkIn: WeeklyCheckInEntry | null;
  activeRecommendations: RecommendedAction[];
  dueFollowUpCount: number;
  overdueFollowUpCount: number;
  currentFocusActionId: string | null;
  onSave: (entry: WeeklyCheckInEntry) => void;
}

export default function WeeklyCheckInPanel({
  className = 'mt-6',
  checkIn,
  activeRecommendations,
  dueFollowUpCount,
  overdueFollowUpCount,
  currentFocusActionId,
  onSave,
}: WeeklyCheckInPanelProps) {
  const [summary, setSummary] = useState(checkIn?.summary ?? '');
  const [blocker, setBlocker] = useState(checkIn?.blocker ?? '');
  const [focusActionId, setFocusActionId] = useState(checkIn?.focusActionId ?? currentFocusActionId ?? '');
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setSummary(checkIn?.summary ?? '');
    setBlocker(checkIn?.blocker ?? '');
    setFocusActionId(checkIn?.focusActionId ?? currentFocusActionId ?? '');
  }, [checkIn, currentFocusActionId]);

  useEffect(() => {
    if (!savedFlash) {
      return;
    }

    const timeout = window.setTimeout(() => setSavedFlash(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [savedFlash]);

  const checkInState = getWeeklyCheckInState(checkIn?.checkedInAt);
  const focusOptions = useMemo(
    () =>
      activeRecommendations.map((action) => ({
        id: action.id,
        label: action.title,
      })),
    [activeRecommendations]
  );

  return (
    <div className={`${className} rounded-[30px] border border-[#ddd3bf] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(249,245,237,0.98))] px-5 py-5 shadow-[0_22px_58px_-46px_rgba(54,44,28,0.55)] sm:px-6`}>
      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ddd3bf] bg-white/80 px-3 py-1 text-xs uppercase tracking-[0.22em] text-[#6d6658] font-body">
            <RefreshCcw size={13} className="text-[#7a724b]" />
            Weekly check-in
          </div>
          <h3 className="mt-4 font-heading text-[2rem] leading-tight text-text-main">
            Re-enter the plan with current information.
          </h3>
          <p className="mt-3 max-w-2xl text-sm text-[#625e53] font-body leading-relaxed">
            This is the retention loop. Instead of reopening the dashboard just to look around, update what changed, name the blocker, and decide the next focus for the week.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] border border-[#e7decd] bg-[#fffdf8] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
                Check-in status
              </p>
              <p className={`mt-2 text-sm font-body leading-snug ${checkInState.needsAttention ? 'text-[#9a5a4c]' : 'text-[#5c6b53]'}`}>
                {checkInState.label}
              </p>
            </div>
            <div className="rounded-[22px] border border-[#f0dcc0] bg-[#fff7e8] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
                Follow-ups due
              </p>
              <p className="mt-2 font-heading text-2xl text-text-main">{dueFollowUpCount}</p>
              <p className="text-xs text-[#8a8377] font-body">within the next 7 days</p>
            </div>
            <div className="rounded-[22px] border border-[#efd2ca] bg-[#fff2ef] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
                Overdue
              </p>
              <p className="mt-2 font-heading text-2xl text-text-main">{overdueFollowUpCount}</p>
              <p className="text-xs text-[#8a8377] font-body">follow-ups that need attention</p>
            </div>
          </div>
        </div>

        <div className="rounded-[26px] border border-[#e3dac9] bg-white/88 px-4 py-4 shadow-[0_18px_38px_-34px_rgba(46,38,27,0.6)]">
          <div className="grid gap-3">
            <div>
              <label
                htmlFor="weekly-summary"
                className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body"
              >
                <CheckCheck size={13} />
                What changed this week?
              </label>
              <textarea
                id="weekly-summary"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="Example: We called two SLP clinics, one needs a referral, the other has a 3-month waitlist."
                className="mt-3 min-h-[92px] w-full resize-y rounded-[18px] border border-[#e3dac9] bg-[#fffdf9] px-4 py-3 text-sm text-text-main font-body outline-none transition-all placeholder:text-[#9b9487] focus:border-[#7f7a57] focus:ring-2 focus:ring-[#7f7a57]/15"
              />
            </div>

            <div>
              <label
                htmlFor="weekly-blocker"
                className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body"
              >
                <ListTodo size={13} />
                What still feels blocked?
              </label>
              <textarea
                id="weekly-blocker"
                value={blocker}
                onChange={(event) => setBlocker(event.target.value)}
                placeholder="Example: Insurance keeps bouncing us between departments and I still do not know if OT needs prior authorization."
                className="mt-3 min-h-[92px] w-full resize-y rounded-[18px] border border-[#e3dac9] bg-[#fffdf9] px-4 py-3 text-sm text-text-main font-body outline-none transition-all placeholder:text-[#9b9487] focus:border-[#7f7a57] focus:ring-2 focus:ring-[#7f7a57]/15"
              />
            </div>

            <div>
              <label
                htmlFor="weekly-focus"
                className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body"
              >
                <CalendarRange size={13} />
                Focus this week
              </label>
              <select
                id="weekly-focus"
                value={focusActionId}
                onChange={(event) => setFocusActionId(event.target.value)}
                className="mt-3 w-full rounded-[18px] border border-[#e3dac9] bg-[#fffdf9] px-4 py-3 text-sm text-text-main font-body outline-none transition-all focus:border-[#7f7a57] focus:ring-2 focus:ring-[#7f7a57]/15"
              >
                <option value="">Follow the default suggested focus</option>
                {focusOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-[#ece3d4] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#8a8377] font-body">
              Saved check-ins stay on this device and shift the current-focus card at the top.
            </p>
            <button
              type="button"
              onClick={() => {
                onSave({
                  summary: summary.trim(),
                  blocker: blocker.trim(),
                  focusActionId: focusActionId || null,
                  checkedInAt: new Date().toISOString(),
                });
                setSavedFlash(true);
              }}
              className="inline-flex items-center justify-center rounded-full bg-[#6d6b47] px-4 py-2.5 text-sm text-white font-body transition-colors hover:bg-[#5a583a]"
            >
              Save weekly check-in
            </button>
          </div>

          {savedFlash && (
            <p className="mt-3 text-sm text-[#4f6d4e] font-body">
              Weekly check-in saved.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
