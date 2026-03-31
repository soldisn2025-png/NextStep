'use client';

import type { FormEvent } from 'react';
import { Compass, MapPin, Sparkles } from 'lucide-react';
import { RecommendedAction } from '@/lib/types';

interface ActionPlanOverviewProps {
  completionPercent: number;
  completedCount: number;
  inProgressCount: number;
  remainingCount: number;
  nextFocus: RecommendedAction | null;
  nextFocusFirstMove: string | null;
  focusContext?: string | null;
  zipInput: string;
  savedZip: string;
  zipError: string;
  localPilotSummary: string;
  hasSupportedRegion: boolean;
  regionLabel: string | null;
  onZipInputChange: (value: string) => void;
  onZipSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClearZip: () => void;
}

export default function ActionPlanOverview({
  completionPercent,
  completedCount,
  inProgressCount,
  remainingCount,
  nextFocus,
  nextFocusFirstMove,
  focusContext,
  zipInput,
  savedZip,
  zipError,
  localPilotSummary,
  hasSupportedRegion,
  regionLabel,
  onZipInputChange,
  onZipSubmit,
  onClearZip,
}: ActionPlanOverviewProps) {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-[#e6dccb] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.92),_rgba(246,241,232,0.98)_55%,_rgba(239,233,221,0.96))] px-5 py-6 shadow-[0_24px_70px_-42px_rgba(61,47,28,0.45)] sm:px-7">
      <div className="absolute -right-14 -top-10 h-36 w-36 rounded-full bg-[#e7edd7]/60 blur-3xl" />
      <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-[#f8e6d4]/70 blur-3xl" />

      <div className="relative grid gap-4 lg:grid-cols-[1.4fr_0.9fr] lg:items-start">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ddd3bf] bg-white/75 px-3 py-1 text-xs uppercase tracking-[0.24em] text-[#6d6658] font-body">
            <Sparkles size={13} className="text-[#7a724b]" />
            Action plan
          </div>
          <h2 className="mt-4 font-heading text-3xl text-text-main leading-tight sm:text-[2.4rem]">
            Take it one step at a time.
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-[#625e53] font-body leading-relaxed">
            This is now a working plan, not just a one-time results screen. Your progress is saved automatically on this device.
          </p>

          <div className="mt-5 rounded-[24px] border border-[#ded5c3] bg-white/80 p-4 shadow-[0_18px_40px_-35px_rgba(46,38,27,0.65)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#817b6e] font-body">
                  Current focus
                </p>
                {focusContext && (
                  <p className="mt-2 max-w-2xl text-xs uppercase tracking-[0.16em] text-[#7a745f] font-body">
                    Weekly reset: {focusContext}
                  </p>
                )}
                <h3 className="mt-2 font-heading text-2xl text-text-main leading-tight">
                  {nextFocus ? nextFocus.title : 'You cleared the current plan.'}
                </h3>
                <p className="mt-2 text-sm text-[#625e53] font-body leading-relaxed">
                  {nextFocusFirstMove ??
                    'Everything in this plan is marked done. You can revisit completed steps or retake the intake if your situation changes.'}
                </p>
              </div>
              <div className="rounded-2xl border border-[#e3dac9] bg-[#fbf8f1] px-4 py-3 min-w-[150px]">
                <p className="text-xs uppercase tracking-[0.2em] text-[#817b6e] font-body">
                  Progress
                </p>
                <p className="mt-2 font-heading text-3xl text-text-main">{completionPercent}%</p>
                <p className="text-sm text-[#625e53] font-body">marked done</p>
              </div>
            </div>

            <div className="mt-4 h-2.5 rounded-full bg-[#ece4d6]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#6d6b47,#9bb07b)] transition-all duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#e7decd] bg-[#fffdf8] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
                  Left
                </p>
                <p className="mt-1 font-heading text-2xl text-text-main">{remainingCount}</p>
              </div>
              <div className="rounded-2xl border border-[#f2dfb9] bg-[#fff7e9] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
                  Working on
                </p>
                <p className="mt-1 font-heading text-2xl text-text-main">{inProgressCount}</p>
              </div>
              <div className="rounded-2xl border border-[#d4e4c8] bg-[#edf6e7] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
                  Done
                </p>
                <p className="mt-1 font-heading text-2xl text-text-main">{completedCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#ddd3bf] bg-white/80 p-5 shadow-[0_18px_40px_-35px_rgba(46,38,27,0.65)]">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef3ff] text-primary flex-shrink-0">
              <MapPin size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#817b6e] font-body">
                Layer in local help
              </p>
              <h3 className="mt-1 font-heading text-xl text-text-main">Add your ZIP code</h3>
              <p className="mt-2 text-sm text-[#625e53] font-body leading-relaxed">
                Bring in local programs, parent groups, and nearby therapy options without changing the plan itself.
              </p>
            </div>
          </div>

          <form onSubmit={onZipSubmit} className="mt-5 flex flex-col gap-2">
            <label htmlFor="localZip" className="sr-only">
              ZIP code for local resources
            </label>
            <input
              id="localZip"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={5}
              value={zipInput}
              onChange={(event) => onZipInputChange(event.target.value)}
              placeholder="ZIP code"
              className="w-full rounded-2xl border border-[#ddd3bf] bg-[#fffdf8] px-4 py-3 text-sm text-text-main font-body outline-none transition-all focus:border-[#7f7a57] focus:ring-2 focus:ring-[#7f7a57]/15"
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6d6b47] px-4 py-3 text-sm text-white font-body transition-colors hover:bg-[#5b593a]"
              >
                <Compass size={15} />
                Show local help
              </button>
              {savedZip && (
                <button
                  type="button"
                  onClick={onClearZip}
                  className="rounded-2xl border border-[#ddd3bf] px-4 py-3 text-sm text-[#625e53] font-body transition-colors hover:border-[#7f7a57] hover:text-[#514c41]"
                >
                  Clear ZIP
                </button>
              )}
            </div>
          </form>

          <p className="mt-4 text-xs text-[#8a8377] font-body leading-relaxed">
            {localPilotSummary}
          </p>
          {zipError && <p className="mt-2 text-sm text-red-500 font-body">{zipError}</p>}
          {!zipError && savedZip && hasSupportedRegion && regionLabel && (
            <p className="mt-2 text-sm text-success font-body">
              Showing curated local resources for {regionLabel}.
            </p>
          )}
          {!zipError && savedZip && !hasSupportedRegion && (
            <p className="mt-2 text-sm text-amber-700 font-body">
              We do not have curated local programs for ZIP {savedZip} yet, but nearby provider search still works.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
