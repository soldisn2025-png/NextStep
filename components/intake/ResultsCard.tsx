'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ClipboardList, RotateCcw, Trophy } from 'lucide-react';
import { getActionPlanGuidance } from '@/lib/actionPlan';
import { intakeSteps } from '@/lib/intakeSteps';
import { getLocationMatch, LOCAL_PILOT_SUMMARY } from '@/lib/localResources';
import {
  ActionPlanProgressMap,
  ActionPlanStatus,
  IntakeAnswers,
  RecommendedAction,
} from '@/lib/types';
import ActionPlanCard from './ActionPlanCard';
import ActionPlanOverview from './ActionPlanOverview';

interface ResultsCardProps {
  answers: IntakeAnswers;
  recommendations: RecommendedAction[];
  onStartOver: () => void;
}

const ZIP_STORAGE_KEY = 'nextstep_local_zip';
const ACTION_PROGRESS_STORAGE_KEY = 'nextstep_action_progress';

const fieldLabels: Record<string, string> = {
  childAge: "Child's age",
  diagnosedBy: 'Diagnosed by',
  diagnoses: 'Diagnoses',
  currentSupport: 'Current support',
  topConcerns: 'Top concerns',
  freeText: 'Additional context',
};

const urgencyOrder: Record<RecommendedAction['urgency'], number> = {
  immediate: 0,
  soon: 1,
  'when-ready': 2,
};

const statusOrder: Record<ActionPlanStatus, number> = {
  'in-progress': 0,
  'not-started': 1,
  done: 2,
};

function parseProgressState(rawValue: string | null): ActionPlanProgressMap {
  if (!rawValue) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawValue) as Record<string, { status?: string; updatedAt?: string }>;

    return Object.fromEntries(
      Object.entries(parsed).flatMap(([actionId, entry]) => {
        if (
          entry?.status === 'not-started' ||
          entry?.status === 'in-progress' ||
          entry?.status === 'done'
        ) {
          return [[actionId, { status: entry.status, updatedAt: entry.updatedAt ?? new Date().toISOString() }]];
        }

        return [];
      })
    );
  } catch {
    return {};
  }
}

function formatSavedAt(updatedAt: string) {
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

export default function ResultsCard({ answers, recommendations, onStartOver }: ResultsCardProps) {
  const [zipInput, setZipInput] = useState('');
  const [savedZip, setSavedZip] = useState('');
  const [zipError, setZipError] = useState('');
  const [progress, setProgress] = useState<ActionPlanProgressMap>({});

  useEffect(() => {
    try {
      const storedZip = localStorage.getItem(ZIP_STORAGE_KEY) ?? '';
      setZipInput(storedZip);
      setSavedZip(storedZip);
      setProgress(parseProgressState(localStorage.getItem(ACTION_PROGRESS_STORAGE_KEY)));
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(ACTION_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // ignore storage errors
    }
  }, [progress]);

  const locationMatch = useMemo(() => getLocationMatch(savedZip), [savedZip]);
  const hasSupportedRegion = Boolean(locationMatch && locationMatch.regionIds.length > 0);

  const recommendationsWithState = useMemo(() => {
    return recommendations
      .map((action, index) => {
        const progressEntry = progress[action.id];
        return {
          action,
          index,
          status: progressEntry?.status ?? 'not-started',
          updatedAt: progressEntry?.updatedAt,
        };
      })
      .sort((a, b) => {
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }

        if (urgencyOrder[a.action.urgency] !== urgencyOrder[b.action.urgency]) {
          return urgencyOrder[a.action.urgency] - urgencyOrder[b.action.urgency];
        }

        return a.index - b.index;
      });
  }, [progress, recommendations]);

  const activeRecommendations = recommendationsWithState.filter(({ status }) => status !== 'done');
  const completedRecommendations = recommendationsWithState.filter(({ status }) => status === 'done');

  const completedCount = completedRecommendations.length;
  const inProgressCount = recommendationsWithState.filter(
    ({ status }) => status === 'in-progress'
  ).length;
  const remainingCount = recommendations.length - completedCount;
  const completionPercent = recommendations.length
    ? Math.round((completedCount / recommendations.length) * 100)
    : 0;

  const nextFocus = activeRecommendations[0]?.action ?? null;
  const nextFocusGuidance = nextFocus ? getActionPlanGuidance(nextFocus.id) : null;

  const handleZipSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = zipInput.replace(/\D/g, '').slice(0, 5);

    if (normalized.length !== 5) {
      setZipError('Enter a valid 5-digit ZIP code.');
      return;
    }

    try {
      localStorage.setItem(ZIP_STORAGE_KEY, normalized);
    } catch {
      // ignore storage errors
    }

    setZipError('');
    setZipInput(normalized);
    setSavedZip(normalized);
  };

  const handleClearZip = () => {
    try {
      localStorage.removeItem(ZIP_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }

    setZipError('');
    setZipInput('');
    setSavedZip('');
  };

  const updateActionStatus = (actionId: string, status: ActionPlanStatus) => {
    setProgress((current) => ({
      ...current,
      [actionId]: {
        status,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const handleStartOver = () => {
    try {
      localStorage.removeItem(ZIP_STORAGE_KEY);
      localStorage.removeItem(ACTION_PROGRESS_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }

    setZipInput('');
    setSavedZip('');
    setZipError('');
    setProgress({});
    onStartOver();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <ActionPlanOverview
        completionPercent={completionPercent}
        completedCount={completedCount}
        inProgressCount={inProgressCount}
        remainingCount={remainingCount}
        nextFocus={nextFocus}
        nextFocusFirstMove={nextFocusGuidance?.firstMove ?? null}
        zipInput={zipInput}
        savedZip={savedZip}
        zipError={zipError}
        localPilotSummary={LOCAL_PILOT_SUMMARY}
        hasSupportedRegion={hasSupportedRegion}
        regionLabel={locationMatch?.primaryRegionLabel ?? null}
        onZipInputChange={(value) => {
          setZipError('');
          setZipInput(value.replace(/\D/g, '').slice(0, 5));
        }}
        onZipSubmit={handleZipSubmit}
        onClearZip={handleClearZip}
      />

      <div className="mt-7 space-y-5">
        {activeRecommendations.map(({ action, status, updatedAt }, index) => (
          <ActionPlanCard
            key={action.id}
            action={action}
            displayIndex={index + 1}
            savedZip={savedZip}
            status={status}
            updatedAt={updatedAt}
            onUpdateStatus={updateActionStatus}
          />
        ))}

        {completedRecommendations.length > 0 && (
          <details className="rounded-[28px] border border-[#ddd3bf] bg-white/75 px-5 py-5 shadow-[0_22px_55px_-45px_rgba(54,44,28,0.65)]">
            <summary className="cursor-pointer list-none select-none">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf6e7] text-[#5a754e]">
                    <Trophy size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
                      Completed steps
                    </p>
                    <h3 className="mt-1 font-heading text-xl text-text-main">
                      {completedRecommendations.length} step{completedRecommendations.length === 1 ? '' : 's'} marked done
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-[#625e53] font-body">
                  Open to review or reopen later.
                </p>
              </div>
            </summary>

            <div className="mt-4 space-y-4">
              {completedRecommendations.map(({ action, updatedAt }) => {
                const guidance = getActionPlanGuidance(action.id);

                return (
                  <div
                    key={action.id}
                    className="rounded-[24px] border border-[#d7e1c7] bg-[#f9fbf1] px-4 py-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center rounded-full border border-[#d4e4c8] bg-[#edf6e7] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#4f6d4e] font-body">
                            Done
                          </span>
                        </div>
                        <h4 className="mt-3 font-heading text-2xl text-text-main">{action.title}</h4>
                        <p className="mt-2 text-sm text-[#625e53] font-body leading-relaxed">
                          {guidance.firstMove}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-[#8a8377] font-body">
                          {updatedAt ? formatSavedAt(updatedAt) : 'Completed'}
                        </p>
                        <button
                          type="button"
                          onClick={() => updateActionStatus(action.id, 'not-started')}
                          className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#d5cfaf] bg-white px-4 py-2 text-sm text-[#5a5549] font-body hover:border-[#7f7a57] hover:text-[#504b40] transition-colors"
                        >
                          <RotateCcw size={14} />
                          Reopen step
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        )}
      </div>

      <details className="mt-8 rounded-[28px] border border-[#ddd3bf] bg-white/75 px-5 py-5 shadow-[0_20px_55px_-48px_rgba(54,44,28,0.65)]">
        <summary className="cursor-pointer list-none select-none">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf4ff] text-primary">
              <ClipboardList size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
                Intake details
              </p>
              <h3 className="mt-1 font-heading text-xl text-text-main">Review your answers</h3>
            </div>
          </div>
        </summary>

        <div className="mt-4 overflow-hidden rounded-[24px] border border-[#e7decd] bg-[#fffdf8]">
          {intakeSteps.map((step, index) => {
            const val = answers[step.fieldName as keyof IntakeAnswers];
            const isEmpty = !val || (Array.isArray(val) && val.length === 0) || val === '';

            if (isEmpty && step.optional) {
              return null;
            }

            return (
              <div
                key={step.fieldName}
                className={`px-4 py-3 ${index === intakeSteps.length - 1 ? '' : 'border-b border-[#eee6d7]'}`}
              >
                <p className="text-xs text-[#8a8377] font-body mb-1">{fieldLabels[step.fieldName]}</p>
                <p className="text-sm text-text-main font-body">
                  {Array.isArray(val) ? val.join(', ') : val || '-'}
                </p>
              </div>
            );
          })}
        </div>
      </details>

      <div className="mt-8 rounded-[30px] border border-[#e3dac9] bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(244,239,231,0.95))] px-6 py-8 text-center shadow-[0_22px_55px_-50px_rgba(54,44,28,0.6)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3eee3] text-[#7a724b]">
          <CheckCircle2 size={20} />
        </div>
        <h3 className="mt-4 font-heading text-2xl text-text-main">You are building a real plan.</h3>
        <p className="mt-3 max-w-2xl mx-auto text-sm text-[#625e53] font-body leading-relaxed">
          Keep the plan simple, work one step at a time, and come back after calls or appointments to mark progress. This journey is heavy enough without forcing everything into one day.
        </p>
      </div>

      <p className="mt-8 text-xs text-[#8a8377] font-body text-center leading-relaxed">
        These recommendations are general guidance based on your answers and do not
        constitute medical or therapeutic advice. Always consult a qualified professional.
      </p>

      <div className="mt-6 flex justify-center">
        <button
          onClick={handleStartOver}
          aria-label="Start over and retake the questionnaire"
          className="flex items-center gap-1.5 text-sm text-[#7e786c] hover:text-primary transition-colors font-body"
        >
          <ArrowLeft size={14} />
          Start over
        </button>
      </div>
    </div>
  );
}
