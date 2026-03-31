'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowUp,
  BellRing,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  RefreshCcw,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import { getActionPlanGuidance } from '@/lib/actionPlan';
import {
  createActionPlanEntry,
  formatRelativeUpdate,
  getFollowUpState,
  getWeeklyCheckInState,
} from '@/lib/actionPlanState';
import { intakeSteps } from '@/lib/intakeSteps';
import { getLocationMatch, LOCAL_PILOT_SUMMARY } from '@/lib/localResources';
import { buildReminderItems } from '@/lib/reminders';
import {
  ActionPlanProgressEntry,
  ActionPlanProgressMap,
  ActionPlanStatus,
  DocumentAnalysisEntry,
  IntakeAnswers,
  PlanSyncStatus,
  RecommendedAction,
  WeeklyCheckInEntry,
} from '@/lib/types';
import ActionPlanCard from './ActionPlanCard';
import ActionPlanOverview from './ActionPlanOverview';
import DocumentActionPanel from './DocumentActionPanel';
import ReminderCenter from './ReminderCenter';
import WeeklyCheckInPanel from './WeeklyCheckInPanel';

interface ResultsCardProps {
  answers: IntakeAnswers;
  recommendations: RecommendedAction[];
  savedZip: string;
  progress: ActionPlanProgressMap;
  weeklyCheckIn: WeeklyCheckInEntry | null;
  documentAnalyses: DocumentAnalysisEntry[];
  syncStatus: PlanSyncStatus;
  accountEmail: string | null;
  onSavedZipChange: (value: string) => void;
  onUpdateActionEntry: (actionId: string, updates: Partial<ActionPlanProgressEntry>) => void;
  onWeeklyCheckInChange: (entry: WeeklyCheckInEntry | null) => void;
  onSaveDocumentAnalysis: (entry: DocumentAnalysisEntry) => void;
  onStartOver: () => void;
}

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

const planMapStatusMeta: Record<
  ActionPlanStatus,
  { label: string; className: string }
> = {
  'not-started': {
    label: 'Not started',
    className: 'border-[#ddd1bc] bg-white text-[#6f6a5b]',
  },
  'in-progress': {
    label: 'Working on it',
    className: 'border-[#d9d3b6] bg-[#f2efde] text-[#676540]',
  },
  done: {
    label: 'Done',
    className: 'border-[#d4e4c8] bg-[#edf6e7] text-[#4f6d4e]',
  },
};

type WorkspacePanel = 'reminders' | 'check-in' | 'documents';

function getInitialWorkspacePanel(
  overdueFollowUpCount: number,
  dueSoonCount: number,
  weeklyNeedsAttention: boolean
): WorkspacePanel {
  if (overdueFollowUpCount > 0 || dueSoonCount > 0) {
    return 'reminders';
  }

  if (weeklyNeedsAttention) {
    return 'check-in';
  }

  return 'documents';
}

function shortenText(value: string, maxLength = 140) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
}

function getSyncMessage(syncStatus: PlanSyncStatus, accountEmail: string | null) {
  switch (syncStatus) {
    case 'synced':
      return {
        text: accountEmail
          ? `Synced to ${accountEmail}`
          : 'Synced to your account',
        className: 'border-[#d4e4c8] bg-[#edf6e7] text-[#4f6d4e]',
      };
    case 'syncing':
      return {
        text: 'Syncing plan changes',
        className: 'border-[#f0dcc0] bg-[#fff7e8] text-[#95611f]',
      };
    case 'error':
      return {
        text: 'Sync failed. Your latest changes still remain on this device.',
        className: 'border-[#efd2ca] bg-[#fff2ef] text-[#a25547]',
      };
    case 'signed-out':
      return {
        text: 'Local-only mode. Sign in to sync across devices.',
        className: 'border-[#e7decd] bg-[#fffdf8] text-[#6f6a5b]',
      };
    case 'not-configured':
      return {
        text: 'Supabase is not configured in this deployment yet.',
        className: 'border-[#e7decd] bg-[#fffdf8] text-[#6f6a5b]',
      };
    default:
      return null;
  }
}

export default function ResultsCard({
  answers,
  recommendations,
  savedZip,
  progress,
  weeklyCheckIn,
  documentAnalyses,
  syncStatus,
  accountEmail,
  onSavedZipChange,
  onUpdateActionEntry,
  onWeeklyCheckInChange,
  onSaveDocumentAnalysis,
  onStartOver,
}: ResultsCardProps) {
  const [zipInput, setZipInput] = useState(savedZip);
  const [zipError, setZipError] = useState('');

  useEffect(() => {
    setZipInput(savedZip);
  }, [savedZip]);

  const locationMatch = useMemo(() => getLocationMatch(savedZip), [savedZip]);
  const hasSupportedRegion = Boolean(locationMatch && locationMatch.regionIds.length > 0);

  const recommendationsWithState = useMemo(() => {
    return recommendations
      .map((action, index) => {
        const progressEntry = createActionPlanEntry(progress[action.id], {});
        return {
          action,
          index,
          entry: progressEntry,
          status: progressEntry.status,
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
  const hasLongPlan = recommendationsWithState.length > 3;
  const remainingCount = recommendations.length - completedCount;
  const completionPercent = recommendations.length
    ? Math.round((completedCount / recommendations.length) * 100)
    : 0;

  const reminderItems = useMemo(
    () => buildReminderItems(activeRecommendations.map(({ action, entry }) => ({ action, entry }))),
    [activeRecommendations]
  );
  const dueSoonCount = reminderItems.filter(
    (item) => item.daysUntil >= 0 && item.daysUntil <= 7
  ).length;
  const overdueFollowUpCount = reminderItems.filter((item) => item.daysUntil < 0).length;
  const weeklyCheckInState = getWeeklyCheckInState(weeklyCheckIn?.checkedInAt);
  const [activeWorkspacePanel, setActiveWorkspacePanel] = useState<WorkspacePanel>(() =>
    getInitialWorkspacePanel(
      overdueFollowUpCount,
      dueSoonCount,
      weeklyCheckInState.needsAttention
    )
  );

  const weeklyFocusAction =
    weeklyCheckIn?.focusActionId
      ? activeRecommendations.find(({ action }) => action.id === weeklyCheckIn.focusActionId)?.action ?? null
      : null;

  const nextFocus = weeklyFocusAction ?? activeRecommendations[0]?.action ?? null;
  const nextFocusGuidance = nextFocus ? getActionPlanGuidance(nextFocus.id) : null;
  const focusContext =
    weeklyFocusAction && weeklyCheckIn
      ? shortenText(
          weeklyCheckIn.summary ||
            weeklyCheckIn.blocker ||
            'Chosen during your latest weekly check-in.'
        )
      : null;

  const syncMessage = getSyncMessage(syncStatus, accountEmail);
  const workspacePanels: Array<{
    id: WorkspacePanel;
    label: string;
    summary: string;
    countLabel: string;
    icon: typeof BellRing;
  }> = [
    {
      id: 'reminders',
      label: 'Reminders',
      summary:
        overdueFollowUpCount > 0
          ? `${overdueFollowUpCount} overdue follow-up${overdueFollowUpCount === 1 ? '' : 's'} need attention.`
          : dueSoonCount > 0
            ? `${dueSoonCount} follow-up${dueSoonCount === 1 ? '' : 's'} are due this week.`
            : reminderItems.length > 0
              ? 'Follow-ups are scheduled and ready when you need them.'
              : 'No follow-ups scheduled yet.',
      countLabel: `${reminderItems.length} scheduled`,
      icon: BellRing,
    },
    {
      id: 'check-in',
      label: 'Weekly reset',
      summary: weeklyCheckInState.label,
      countLabel: weeklyCheckInState.daysSince === null ? 'Not checked in yet' : `${weeklyCheckInState.daysSince}d since update`,
      icon: RefreshCcw,
    },
    {
      id: 'documents',
      label: 'Paperwork tool',
      summary:
        documentAnalyses.length > 0
          ? `${documentAnalyses.length} saved document analys${documentAnalyses.length === 1 ? 'is' : 'es'} ready to revisit.`
          : 'Analyze pasted emails, reports, or denial letters when they show up.',
      countLabel:
        documentAnalyses.length > 0
          ? `${documentAnalyses.length} saved`
          : 'Ready when needed',
      icon: FileText,
    },
  ];

  const handleZipSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = zipInput.replace(/\D/g, '').slice(0, 5);

    if (normalized.length !== 5) {
      setZipError('Enter a valid 5-digit ZIP code.');
      return;
    }

    setZipError('');
    onSavedZipChange(normalized);
  };

  const handleClearZip = () => {
    setZipError('');
    setZipInput('');
    onSavedZipChange('');
  };

  const updateActionStatus = (actionId: string, status: ActionPlanStatus) => {
    onUpdateActionEntry(actionId, { status });
  };

  return (
    <div className={`max-w-5xl mx-auto px-4 py-8 ${hasLongPlan ? 'pb-28' : ''}`}>
      <ActionPlanOverview
        completionPercent={completionPercent}
        completedCount={completedCount}
        inProgressCount={inProgressCount}
        remainingCount={remainingCount}
        nextFocus={nextFocus}
        nextFocusFirstMove={nextFocusGuidance?.firstMove ?? null}
        focusContext={focusContext}
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

      <div
        id="plan-map"
        className="mt-4 rounded-[28px] border border-[#ddd3bf] bg-white/85 px-5 py-5 shadow-[0_22px_55px_-45px_rgba(54,44,28,0.55)]"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
              Plan map
            </p>
            <h3 className="mt-2 font-heading text-2xl text-text-main">
              See the whole plan before opening the details.
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-[#625e53] font-body leading-relaxed">
              Jump straight to the next step, keep one workspace open at a time, and leave the heavy tools folded away until they are needed.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {syncMessage && (
              <span
                className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-body ${syncMessage.className}`}
              >
                {syncMessage.text}
              </span>
            )}
            <a
              href="#plan-tools"
              className="inline-flex items-center gap-2 rounded-full border border-[#ddd3bf] bg-[#fffdf8] px-4 py-2 text-sm text-[#5a5549] font-body transition-colors hover:border-[#7f7a57] hover:text-[#504b40]"
            >
              Plan tools
              <ChevronRight size={14} />
            </a>
            <a
              href="#action-list"
              className="inline-flex items-center gap-2 rounded-full border border-[#ddd3bf] bg-[#fffdf8] px-4 py-2 text-sm text-[#5a5549] font-body transition-colors hover:border-[#7f7a57] hover:text-[#504b40]"
            >
              Active steps
              <ChevronRight size={14} />
            </a>
            {completedRecommendations.length > 0 && (
              <a
                href="#completed-steps"
                className="inline-flex items-center gap-2 rounded-full border border-[#ddd3bf] bg-[#fffdf8] px-4 py-2 text-sm text-[#5a5549] font-body transition-colors hover:border-[#7f7a57] hover:text-[#504b40]"
              >
                Completed
                <ChevronRight size={14} />
              </a>
            )}
          </div>
        </div>

        {activeRecommendations.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {activeRecommendations.map(({ action, entry, status }, index) => {
              const followUpState = getFollowUpState(entry.nextFollowUpDate, status);

              return (
                <a
                  key={action.id}
                  href={`#action-${action.id}`}
                  className="rounded-[24px] border border-[#e6dccb] bg-[#fffdf8] px-4 py-4 transition-colors hover:border-[#d3c7ae] hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
                      Step {index + 1}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] font-body ${planMapStatusMeta[status].className}`}
                    >
                      {planMapStatusMeta[status].label}
                    </span>
                  </div>
                  <h4 className="mt-3 font-heading text-xl leading-tight text-text-main">
                    {action.title}
                  </h4>
                  <p className="mt-2 text-sm text-[#625e53] font-body leading-relaxed">
                    {followUpState.label}
                  </p>
                </a>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-[24px] border border-[#d7e1c7] bg-[#f7fbf2] px-4 py-4">
            <p className="text-sm text-[#5d6e55] font-body leading-relaxed">
              There are no active steps left right now. Review completed items below or retake the intake if your situation has changed.
            </p>
          </div>
        )}
      </div>

      <div
        id="plan-tools"
        className="mt-6 rounded-[28px] border border-[#ddd3bf] bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(247,243,235,0.96))] px-5 py-5 shadow-[0_22px_55px_-45px_rgba(54,44,28,0.55)]"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
              Plan tools
            </p>
            <h3 className="mt-2 font-heading text-2xl text-text-main">
              Keep one workspace open at a time.
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-[#625e53] font-body leading-relaxed">
              The plan stays readable when reminders, weekly reset, and paperwork support stop stacking on top of one another.
            </p>
          </div>
          <a
            href="#action-list"
            className="inline-flex items-center gap-2 rounded-full border border-[#ddd3bf] bg-[#fffdf8] px-4 py-2 text-sm text-[#5a5549] font-body transition-colors hover:border-[#7f7a57] hover:text-[#504b40]"
          >
            Back to active steps
            <ChevronRight size={14} />
          </a>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {workspacePanels.map((panel) => {
            const Icon = panel.icon;
            const isActive = activeWorkspacePanel === panel.id;

            return (
              <button
                key={panel.id}
                type="button"
                onClick={() => setActiveWorkspacePanel(panel.id)}
                className={`rounded-[22px] border px-4 py-4 text-left transition-colors ${
                  isActive
                    ? 'border-[#d5cfaf] bg-[#f8f3e6] shadow-[0_18px_40px_-34px_rgba(54,44,28,0.28)]'
                    : 'border-[#e6dccb] bg-white/80 hover:border-[#d3c7ae] hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#7a724b]">
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
                        {panel.label}
                      </p>
                      <p className="mt-1 text-sm text-text-main font-body">
                        {panel.countLabel}
                      </p>
                    </div>
                  </div>
                  {isActive && (
                    <span className="inline-flex items-center rounded-full border border-[#d5cfaf] bg-white px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#6b6642] font-body">
                      Open
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm text-[#625e53] font-body leading-relaxed">
                  {panel.summary}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {activeWorkspacePanel === 'reminders' && (
        <ReminderCenter
          className="mt-4"
          items={activeRecommendations.map(({ action, entry }) => ({ action, entry }))}
        />
      )}

      {activeWorkspacePanel === 'documents' && (
        <DocumentActionPanel
          className="mt-4"
          analyses={documentAnalyses}
          onSaveAnalysis={onSaveDocumentAnalysis}
        />
      )}

      {activeWorkspacePanel === 'check-in' && (
        <WeeklyCheckInPanel
          className="mt-4"
          checkIn={weeklyCheckIn}
          activeRecommendations={activeRecommendations.map(({ action }) => action)}
          dueFollowUpCount={dueSoonCount}
          overdueFollowUpCount={overdueFollowUpCount}
          currentFocusActionId={nextFocus?.id ?? null}
          onSave={onWeeklyCheckInChange}
        />
      )}

      <div id="action-list" className="mt-7 space-y-5">
        {activeRecommendations.map(({ action, entry }, index) => (
          <ActionPlanCard
            key={action.id}
            action={action}
            displayIndex={index + 1}
            savedZip={savedZip}
            entry={entry}
            onUpdateStatus={updateActionStatus}
            onUpdateEntry={onUpdateActionEntry}
          />
        ))}

        {completedRecommendations.length > 0 && (
          <details
            id="completed-steps"
            className="rounded-[28px] border border-[#d7e1c7] bg-[#f7fbf2] px-5 py-5 shadow-[0_22px_55px_-45px_rgba(54,44,28,0.65)]"
          >
            <summary className="cursor-pointer list-none">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf6e7] text-[#5a754e]">
                    <Trophy size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#73856b] font-body">
                      Completed steps
                    </p>
                    <h3 className="mt-1 font-heading text-xl text-text-main">
                      {completedRecommendations.length} step{completedRecommendations.length === 1 ? '' : 's'} marked done
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-[#5d6e55] font-body">
                  Open completed steps only when you want to verify or reopen them.
                </p>
              </div>
            </summary>

            <div className="mt-4 space-y-4">
              {completedRecommendations.map(({ action, entry }) => {
                const guidance = getActionPlanGuidance(action.id);

                return (
                  <div
                    key={action.id}
                    className="rounded-[24px] border border-[#d7e1c7] bg-white px-4 py-4"
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
                          {entry?.updatedAt ? formatRelativeUpdate(entry.updatedAt) : 'Completed'}
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

      <details
        id="intake-details"
        className="mt-8 rounded-[28px] border border-[#ddd3bf] bg-white/75 px-5 py-5 shadow-[0_20px_55px_-48px_rgba(54,44,28,0.65)]"
      >
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
          onClick={onStartOver}
          aria-label="Start over and retake the questionnaire"
          className="flex items-center gap-1.5 text-sm text-[#7e786c] hover:text-primary transition-colors font-body"
        >
          <ArrowLeft size={14} />
          Start over
        </button>
      </div>

      {hasLongPlan && (
        <a
          href="#plan-map"
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-[#d5cfaf] bg-[#6d6b47] px-4 py-3 text-sm text-white shadow-[0_18px_40px_-24px_rgba(54,44,28,0.75)] transition-colors hover:bg-[#5a583a] focus:outline-none focus:ring-2 focus:ring-[#7f7a57]/30"
        >
          <ArrowUp size={15} />
          Back to plan map
        </a>
      )}
    </div>
  );
}
