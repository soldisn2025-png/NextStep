'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  ArrowUp,
  BellRing,
  CheckCircle2,
  CircleOff,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  LogIn,
  LogOut,
  Map,
  Mail,
  RefreshCcw,
  RotateCcw,
  Target,
  Trophy,
  UserRound,
  X,
} from 'lucide-react';
import { useSupabaseAuth } from '@/components/providers/SupabaseAuthProvider';
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
  skipped: 3,
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
  skipped: {
    label: 'Skipped',
    className: 'border-[#e2dbcf] bg-[#f5f2ec] text-[#726a5f]',
  },
};

type WorkspacePanel = 'reminders' | 'check-in' | 'documents';
type MobileTab = 'focus' | 'plan' | 'tools' | 'history';

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
  const { user, isConfigured, isLoading, magicLinkSentTo, sendMagicLink, signOut } =
    useSupabaseAuth();
  const [zipInput, setZipInput] = useState(savedZip);
  const [zipError, setZipError] = useState('');
  const [showMobileAuthSheet, setShowMobileAuthSheet] = useState(false);
  const [mobileAuthEmail, setMobileAuthEmail] = useState(accountEmail ?? '');
  const [mobileAuthError, setMobileAuthError] = useState('');
  const [isSubmittingMobileAuth, setIsSubmittingMobileAuth] = useState(false);
  const stepScrollerRef = useRef<HTMLDivElement | null>(null);
  const [mobileStepCanScrollLeft, setMobileStepCanScrollLeft] = useState(false);
  const [mobileStepCanScrollRight, setMobileStepCanScrollRight] = useState(false);

  useEffect(() => {
    setZipInput(savedZip);
  }, [savedZip]);

  useEffect(() => {
    if (accountEmail) {
      setMobileAuthEmail(accountEmail);
    }
  }, [accountEmail]);

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

  const activeRecommendations = recommendationsWithState.filter(
    ({ status }) => status !== 'done' && status !== 'skipped'
  );
  const completedRecommendations = recommendationsWithState.filter(({ status }) => status === 'done');
  const skippedRecommendations = recommendationsWithState.filter(({ status }) => status === 'skipped');

  const completedCount = completedRecommendations.length;
  const skippedCount = skippedRecommendations.length;
  const notStartedCount = recommendationsWithState.filter(
    ({ status }) => status === 'not-started'
  ).length;
  const inProgressCount = recommendationsWithState.filter(
    ({ status }) => status === 'in-progress'
  ).length;
  const hasLongPlan = recommendationsWithState.length > 3;
  const progressDenominator = recommendations.length - skippedCount;
  const completionPercent = progressDenominator > 0
    ? Math.round((completedCount / progressDenominator) * 100)
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
  const [mobileTab, setMobileTab] = useState<MobileTab>('focus');
  const [selectedMobileActionId, setSelectedMobileActionId] = useState<string | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  const weeklyFocusAction =
    weeklyCheckIn?.focusActionId
      ? activeRecommendations.find(({ action }) => action.id === weeklyCheckIn.focusActionId)?.action ?? null
      : null;

  const nextFocus = weeklyFocusAction ?? activeRecommendations[0]?.action ?? null;
  const nextFocusGuidance = nextFocus ? getActionPlanGuidance(nextFocus.id) : null;
  const emptyFocusTitle = skippedCount > 0
    ? 'No active step selected right now.'
    : 'You cleared the current plan.';
  const emptyFocusMessage = skippedCount > 0
    ? 'Everything left in this plan is currently skipped. Restore a skipped suggestion below if your situation changes.'
    : 'Everything in this plan is marked done. You can revisit completed steps or retake the intake if your situation changes.';
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
  const mobileTabs: Array<{
    id: MobileTab;
    label: string;
    icon: typeof Target;
  }> = [
    { id: 'focus', label: 'Focus', icon: Target },
    { id: 'plan', label: 'Plan', icon: Map },
    { id: 'tools', label: 'Tools', icon: BellRing },
    { id: 'history', label: 'History', icon: Archive },
  ];

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const syncViewport = () => setIsMobileViewport(mediaQuery.matches);

    syncViewport();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncViewport);
      return () => mediaQuery.removeEventListener('change', syncViewport);
    }

    mediaQuery.addListener(syncViewport);
    return () => mediaQuery.removeListener(syncViewport);
  }, []);

  useEffect(() => {
    if (!isMobileViewport || typeof document === 'undefined') {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isMobileViewport]);

  useEffect(() => {
    if (activeRecommendations.length === 0) {
      setSelectedMobileActionId(null);
      return;
    }

    if (
      selectedMobileActionId &&
      activeRecommendations.some(({ action }) => action.id === selectedMobileActionId)
    ) {
      return;
    }

    setSelectedMobileActionId(nextFocus?.id ?? activeRecommendations[0]?.action.id ?? null);
  }, [activeRecommendations, nextFocus, selectedMobileActionId]);

  const selectedMobileRecommendation =
    activeRecommendations.find(({ action }) => action.id === selectedMobileActionId) ??
    activeRecommendations[0] ??
    null;
  const selectedMobileIndex = selectedMobileRecommendation
    ? activeRecommendations.findIndex(
        ({ action }) => action.id === selectedMobileRecommendation.action.id
      )
    : -1;
  const syncMobileStepOverflow = () => {
    const container = stepScrollerRef.current;

    if (!container) {
      setMobileStepCanScrollLeft(false);
      setMobileStepCanScrollRight(false);
      return;
    }

    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    setMobileStepCanScrollLeft(container.scrollLeft > 8);
    setMobileStepCanScrollRight(maxScrollLeft - container.scrollLeft > 8);
  };
  const activeMobileTabLabel =
    mobileTabs.find((tab) => tab.id === mobileTab)?.label ?? 'Plan';
  const mobileHeaderEyebrow =
    mobileTab === 'focus' && selectedMobileRecommendation
      ? `Step ${selectedMobileIndex + 1} of ${Math.max(activeRecommendations.length, 1)}`
      : activeMobileTabLabel;
  const mobileHeaderTitle =
    mobileTab === 'focus'
      ? selectedMobileRecommendation?.action.title ?? nextFocus?.title ?? emptyFocusTitle
      : nextFocus?.title ?? 'NextStep plan';
  const showMobileSyncCta = isConfigured && !isLoading && !user;

  useEffect(() => {
    if (mobileTab !== 'focus') {
      return;
    }

    const timer = window.setTimeout(() => {
      syncMobileStepOverflow();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [mobileTab, activeRecommendations.length, selectedMobileActionId]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('resize', syncMobileStepOverflow);
    return () => window.removeEventListener('resize', syncMobileStepOverflow);
  }, []);

  useEffect(() => {
    if (mobileTab !== 'focus' || !selectedMobileRecommendation) {
      return;
    }

    const selectedElement = document.getElementById(
      `mobile-step-chip-${selectedMobileRecommendation.action.id}`
    );

    selectedElement?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [mobileTab, selectedMobileRecommendation]);

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

  const handleMobileAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = mobileAuthEmail.trim();

    if (!normalizedEmail) {
      setMobileAuthError('Enter an email address.');
      return;
    }

    setIsSubmittingMobileAuth(true);
    setMobileAuthError('');

    const result = await sendMagicLink(normalizedEmail);
    if (result.error) {
      setMobileAuthError(result.error);
    }

    setIsSubmittingMobileAuth(false);
  };

  const handleClearZip = () => {
    setZipError('');
    setZipInput('');
    onSavedZipChange('');
  };

  const updateActionStatus = (actionId: string, status: ActionPlanStatus) => {
    onUpdateActionEntry(actionId, { status });
  };

  const openMobileAction = (actionId: string) => {
    setSelectedMobileActionId(actionId);
    setMobileTab('focus');

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={`relative lg:max-w-5xl lg:mx-auto lg:px-4 lg:py-8 ${hasLongPlan ? 'lg:pb-28' : ''}`}>
      <div className="fixed inset-0 z-40 bg-[#fbf7ef] lg:hidden">
        <div className="flex h-[100dvh] flex-col pt-[env(safe-area-inset-top)]">
          <div className="border-b border-[#e5dccb] bg-[#fbf7ef]/95 px-3 py-2 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#8a8377] font-body">
                  {mobileHeaderEyebrow}
                </p>
                <h2 className="mt-1 truncate font-heading text-lg leading-tight text-text-main">
                  {mobileHeaderTitle}
                </h2>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {isLoading ? (
                  <div className="inline-flex items-center rounded-full border border-[#ddd3bf] bg-white/80 px-2.5 py-1 text-[11px] text-[#5a5549] font-body">
                    <RefreshCcw size={12} className="animate-spin" />
                  </div>
                ) : user ? (
                  <button
                    type="button"
                    onClick={() => setShowMobileAuthSheet(true)}
                    className="inline-flex items-center gap-1 rounded-full border border-[#ddd3bf] bg-white/80 px-2.5 py-1 text-[11px] text-[#5a5549] font-body"
                  >
                    <UserRound size={12} />
                    Account
                  </button>
                ) : showMobileSyncCta ? (
                  <button
                    type="button"
                    onClick={() => setShowMobileAuthSheet(true)}
                    className="inline-flex items-center gap-1 rounded-full bg-[#6d6b47] px-2.5 py-1 text-[11px] text-white font-body"
                  >
                    <LogIn size={12} />
                    Sign in
                  </button>
                ) : null}
                <div className="rounded-full border border-[#ddd3bf] bg-white/80 px-2.5 py-1 text-xs text-[#5a5549] font-body">
                  {completionPercent}%
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-[calc(env(safe-area-inset-bottom)+64px)] pt-3">
            <div className="space-y-4">
          {mobileTab === 'focus' && (
            <>
              {syncMessage && (
                showMobileSyncCta ? (
                  <button
                    type="button"
                    onClick={() => setShowMobileAuthSheet(true)}
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-body ${syncMessage.className}`}
                  >
                    Sign in to sync across devices
                  </button>
                ) : (
                  <div
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-body ${syncMessage.className}`}
                  >
                    {syncMessage.text}
                  </div>
                )
              )}

              {activeRecommendations.length > 1 && (
                <div className="relative">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#8a8377] font-body">
                      Plan steps
                    </p>
                    {activeRecommendations.length > 3 && (
                      <p className="text-[11px] text-[#8a8377] font-body">
                        {mobileStepCanScrollRight || mobileStepCanScrollLeft
                          ? 'Swipe for more'
                          : `${activeRecommendations.length} steps`}
                      </p>
                    )}
                  </div>
                  <div
                    ref={stepScrollerRef}
                    onScroll={syncMobileStepOverflow}
                    className="overflow-x-auto pb-1"
                  >
                    <div className="flex gap-2">
                    {activeRecommendations.map(({ action, status }, index) => (
                      <button
                        id={`mobile-step-chip-${action.id}`}
                        key={action.id}
                        type="button"
                        onClick={() => setSelectedMobileActionId(action.id)}
                        className={`min-w-[148px] max-w-[148px] rounded-[16px] border px-3 py-2 text-left transition-colors ${
                          selectedMobileRecommendation?.action.id === action.id
                            ? 'border-[#d5cfaf] bg-[#f8f3e6]'
                            : 'border-[#e6dccb] bg-white/85'
                        }`}
                      >
                        <p className="text-[11px] uppercase tracking-[0.16em] text-[#8a8377] font-body">
                          Step {index + 1}
                        </p>
                        <p
                          className="mt-1 text-sm text-text-main font-body leading-snug"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: '3.6rem',
                          }}
                        >
                          {action.title}
                        </p>
                        <p className="mt-1 text-[11px] text-[#8a8377] font-body">
                          {planMapStatusMeta[status].label}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
                  {mobileStepCanScrollLeft && (
                    <div className="pointer-events-none absolute inset-y-[30px] left-0 w-8 bg-gradient-to-r from-[#fbf7ef] to-transparent" />
                  )}
                  {mobileStepCanScrollRight && (
                    <div className="pointer-events-none absolute inset-y-[30px] right-0 w-8 bg-gradient-to-l from-[#fbf7ef] to-transparent" />
                  )}
                </div>
              )}

              {selectedMobileRecommendation ? (
                <>
                  <ActionPlanCard
                    action={selectedMobileRecommendation.action}
                    displayIndex={selectedMobileIndex + 1}
                    savedZip={savedZip}
                    entry={selectedMobileRecommendation.entry}
                    mobileMode
                    onUpdateStatus={updateActionStatus}
                    onUpdateEntry={onUpdateActionEntry}
                  />

                  {activeRecommendations.length > 1 && (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        disabled={selectedMobileIndex <= 0}
                        onClick={() =>
                          selectedMobileIndex > 0 &&
                          setSelectedMobileActionId(
                            activeRecommendations[selectedMobileIndex - 1]?.action.id ?? null
                          )
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-[#ddd3bf] bg-white px-4 py-3 text-sm text-[#5a5549] font-body disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ChevronLeft size={14} />
                        Previous
                      </button>
                      <button
                        type="button"
                        disabled={selectedMobileIndex >= activeRecommendations.length - 1}
                        onClick={() =>
                          selectedMobileIndex < activeRecommendations.length - 1 &&
                          setSelectedMobileActionId(
                            activeRecommendations[selectedMobileIndex + 1]?.action.id ?? null
                          )
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#6d6b47] px-4 py-3 text-sm text-white font-body disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Next
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-[24px] border border-[#d7e1c7] bg-[#f7fbf2] px-4 py-4">
                  <p className="text-sm text-[#5d6e55] font-body leading-relaxed">
                    There is no active step right now. Switch to History if you want to review completed or skipped items.
                  </p>
                </div>
              )}
            </>
          )}

          {mobileTab === 'plan' && (
            <>
              <div className="rounded-[28px] border border-[#ddd3bf] bg-white/90 px-4 py-4 shadow-[0_18px_42px_-34px_rgba(54,44,28,0.45)]">
                <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
                  Dashboard
                </p>
                <p className="mt-2 text-sm text-[#625e53] font-body leading-relaxed">
                  {nextFocusGuidance?.firstMove ?? emptyFocusMessage}
                </p>
                <div className="mt-4 h-2 rounded-full bg-[#ece4d6]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#6d6b47,#9bb07b)]"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-[18px] border border-[#e7decd] bg-[#fffdf8] px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#8a8377] font-body">
                      Not started
                    </p>
                    <p className="mt-1 font-heading text-xl text-text-main">{notStartedCount}</p>
                  </div>
                  <div className="rounded-[18px] border border-[#f2dfb9] bg-[#fff7e9] px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#8a8377] font-body">
                      Working on
                    </p>
                    <p className="mt-1 font-heading text-xl text-text-main">{inProgressCount}</p>
                  </div>
                  <div className="rounded-[18px] border border-[#d4e4c8] bg-[#edf6e7] px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#8a8377] font-body">
                      Done
                    </p>
                    <p className="mt-1 font-heading text-xl text-text-main">{completedCount}</p>
                  </div>
                  <div className="rounded-[18px] border border-[#e2dbcf] bg-[#f5f2ec] px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#8a8377] font-body">
                      Skipped
                    </p>
                    <p className="mt-1 font-heading text-xl text-text-main">{skippedCount}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-[#ddd3bf] bg-white/90 px-4 py-4 shadow-[0_18px_42px_-34px_rgba(54,44,28,0.45)]">
                <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
                  Local help
                </p>
                <form onSubmit={handleZipSubmit} className="mt-3 space-y-3">
                  <input
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={5}
                    value={zipInput}
                    onChange={(event) => {
                      setZipError('');
                      setZipInput(event.target.value.replace(/\D/g, '').slice(0, 5));
                    }}
                    placeholder="ZIP code"
                    className="w-full rounded-[18px] border border-[#ddd3bf] bg-[#fffdf8] px-4 py-3 text-sm text-text-main font-body outline-none transition-all focus:border-[#7f7a57] focus:ring-2 focus:ring-[#7f7a57]/15"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-[18px] bg-[#6d6b47] px-4 py-3 text-sm text-white font-body"
                    >
                      Show local help
                    </button>
                    {savedZip && (
                      <button
                        type="button"
                        onClick={handleClearZip}
                        className="rounded-[18px] border border-[#ddd3bf] px-4 py-3 text-sm text-[#625e53] font-body"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </form>
                {zipError && <p className="mt-2 text-sm text-red-500 font-body">{zipError}</p>}
                {!zipError && savedZip && hasSupportedRegion && locationMatch?.primaryRegionLabel && (
                  <p className="mt-3 text-sm text-success font-body">
                    Showing curated local resources for {locationMatch.primaryRegionLabel}.
                  </p>
                )}
                {!zipError && savedZip && !hasSupportedRegion && (
                  <p className="mt-3 text-sm text-amber-700 font-body">
                    Curated programs are not available for ZIP {savedZip} yet, but provider search still works.
                  </p>
                )}
                <p className="mt-3 text-xs text-[#8a8377] font-body leading-relaxed">
                  {LOCAL_PILOT_SUMMARY}
                </p>
              </div>

              <div className="space-y-3">
                {activeRecommendations.length > 0 ? (
                  activeRecommendations.map(({ action, entry, status }, index) => {
                    const followUpState = getFollowUpState(entry.nextFollowUpDate, status);

                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => openMobileAction(action.id)}
                        className="w-full rounded-[24px] border border-[#e6dccb] bg-white/90 px-4 py-4 text-left shadow-[0_18px_42px_-34px_rgba(54,44,28,0.4)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-[#8a8377] font-body">
                              Step {index + 1}
                            </p>
                            <h3 className="mt-2 font-heading text-xl text-text-main">
                              {action.title}
                            </h3>
                            <p className="mt-2 text-sm text-[#625e53] font-body leading-relaxed">
                              {followUpState.label}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] font-body ${planMapStatusMeta[status].className}`}
                          >
                            {planMapStatusMeta[status].label}
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-[24px] border border-[#d7e1c7] bg-[#f7fbf2] px-4 py-4">
                    <p className="text-sm text-[#5d6e55] font-body leading-relaxed">
                      No active steps are left in the plan right now.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {mobileTab === 'tools' && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
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
                          ? 'border-[#d5cfaf] bg-[#f8f3e6]'
                          : 'border-[#e6dccb] bg-white/85'
                      }`}
                    >
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
                    </button>
                  );
                })}
              </div>

              {activeWorkspacePanel === 'reminders' && (
                <ReminderCenter
                  className=""
                  items={activeRecommendations.map(({ action, entry }) => ({ action, entry }))}
                />
              )}

              {activeWorkspacePanel === 'documents' && (
                <DocumentActionPanel
                  className=""
                  analyses={documentAnalyses}
                  onSaveAnalysis={onSaveDocumentAnalysis}
                />
              )}

              {activeWorkspacePanel === 'check-in' && (
                <WeeklyCheckInPanel
                  className=""
                  checkIn={weeklyCheckIn}
                  activeRecommendations={activeRecommendations.map(({ action }) => action)}
                  dueFollowUpCount={dueSoonCount}
                  overdueFollowUpCount={overdueFollowUpCount}
                  currentFocusActionId={nextFocus?.id ?? null}
                  onSave={onWeeklyCheckInChange}
                />
              )}
            </>
          )}

          {mobileTab === 'history' && (
            <div className="space-y-4">
              {completedRecommendations.length > 0 && (
                <div className="rounded-[28px] border border-[#d7e1c7] bg-[#f7fbf2] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#73856b] font-body">
                    Completed
                  </p>
                  <div className="mt-3 space-y-3">
                    {completedRecommendations.map(({ action, entry }) => (
                      <div key={action.id} className="rounded-[20px] border border-[#d7e1c7] bg-white px-4 py-4">
                        <h4 className="font-heading text-xl text-text-main">{action.title}</h4>
                        <p className="mt-2 text-xs text-[#8a8377] font-body">
                          {entry?.updatedAt ? formatRelativeUpdate(entry.updatedAt) : 'Completed'}
                        </p>
                        <button
                          type="button"
                          onClick={() => updateActionStatus(action.id, 'not-started')}
                          className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#d5cfaf] bg-white px-4 py-2 text-sm text-[#5a5549] font-body"
                        >
                          <RotateCcw size={14} />
                          Reopen
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {skippedRecommendations.length > 0 && (
                <div className="rounded-[28px] border border-[#ddd5c8] bg-[#f7f4ef] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#7d7569] font-body">
                    Skipped
                  </p>
                  <div className="mt-3 space-y-3">
                    {skippedRecommendations.map(({ action, entry }) => (
                      <div key={action.id} className="rounded-[20px] border border-[#e0d8cb] bg-white px-4 py-4">
                        <h4 className="font-heading text-xl text-text-main">{action.title}</h4>
                        <p className="mt-2 text-xs text-[#8a8377] font-body">
                          {entry?.updatedAt ? formatRelativeUpdate(entry.updatedAt) : 'Skipped'}
                        </p>
                        <button
                          type="button"
                          onClick={() => updateActionStatus(action.id, 'not-started')}
                          className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#d5cfaf] bg-white px-4 py-2 text-sm text-[#5a5549] font-body"
                        >
                          <RotateCcw size={14} />
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <details className="rounded-[28px] border border-[#ddd3bf] bg-white/80 px-4 py-4">
                <summary className="cursor-pointer list-none text-sm text-[#5a5549] font-body">
                  Review intake answers
                </summary>
                <div className="mt-3 overflow-hidden rounded-[20px] border border-[#e7decd] bg-[#fffdf8]">
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
                        <p className="text-xs text-[#8a8377] font-body mb-1">
                          {fieldLabels[step.fieldName]}
                        </p>
                        <p className="text-sm text-text-main font-body">
                          {Array.isArray(val) ? val.join(', ') : val || '-'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </details>

              <div className="flex justify-center pt-2">
                <button
                  onClick={onStartOver}
                  aria-label="Start over and retake the questionnaire"
                  className="flex items-center gap-1.5 text-sm text-[#7e786c] hover:text-primary transition-colors font-body"
                >
                  <ArrowLeft size={14} />
                  Start over
                </button>
              </div>
            </div>
          )}

          {showMobileAuthSheet && (
            <div className="fixed inset-0 z-50">
              <button
                type="button"
                aria-label="Close account sheet"
                onClick={() => {
                  setShowMobileAuthSheet(false);
                  setMobileAuthError('');
                }}
                className="absolute inset-0 bg-[#2f271d]/45"
              />
              <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] border border-[#ddd3bf] bg-[#fffdf8] px-4 py-4 shadow-[0_-16px_48px_-24px_rgba(24,18,10,0.55)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
                      Account sync
                    </p>
                    <h3 className="mt-1 font-heading text-2xl text-text-main">
                      {user ? 'Signed in' : 'Sign in to sync'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileAuthSheet(false);
                      setMobileAuthError('');
                    }}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#ddd3bf] bg-white text-[#5a5549]"
                  >
                    <X size={16} />
                  </button>
                </div>

                {!isConfigured ? (
                  <p className="mt-3 text-sm text-[#625e53] font-body leading-relaxed">
                    Account sync is not configured in this deployment yet.
                  </p>
                ) : user ? (
                  <>
                    <p className="mt-3 text-sm text-[#625e53] font-body break-all">
                      {user.email}
                    </p>
                    <p className="mt-2 text-sm text-[#625e53] font-body leading-relaxed">
                      This device is connected and your plan can sync across devices.
                    </p>
                    <button
                      type="button"
                      onClick={() => void signOut()}
                      className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#ddd3bf] bg-white px-4 py-2 text-sm text-[#5a5549] font-body"
                    >
                      <LogOut size={14} />
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <p className="mt-3 text-sm text-[#625e53] font-body leading-relaxed">
                      Enter your email and we will send a magic sign-in link.
                    </p>
                    <form onSubmit={handleMobileAuthSubmit} className="mt-4 space-y-3">
                      <label htmlFor="mobileAuthEmail" className="sr-only">
                        Email address
                      </label>
                      <input
                        id="mobileAuthEmail"
                        type="email"
                        autoComplete="email"
                        value={mobileAuthEmail}
                        onChange={(event) => setMobileAuthEmail(event.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-[18px] border border-[#ddd3bf] bg-[#fffdf8] px-4 py-3 text-sm text-text-main font-body outline-none transition-all focus:border-[#7f7a57] focus:ring-2 focus:ring-[#7f7a57]/15"
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingMobileAuth}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#6d6b47] px-4 py-3 text-sm text-white font-body disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isSubmittingMobileAuth ? (
                          <RefreshCcw size={14} className="animate-spin" />
                        ) : (
                          <Mail size={14} />
                        )}
                        {isSubmittingMobileAuth ? 'Sending link' : 'Email me a sign-in link'}
                      </button>
                    </form>
                    {magicLinkSentTo && (
                      <p className="mt-3 text-sm text-[#4f6d4e] font-body">
                        Link sent to {magicLinkSentTo}.
                      </p>
                    )}
                    {mobileAuthError && (
                      <p className="mt-3 text-sm text-[#a25547] font-body">
                        {mobileAuthError}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
            </div>
          </div>

          <div className="border-t border-[#e5dccb] bg-[#fffdf8]/95 px-3 py-1 pb-[calc(env(safe-area-inset-bottom)+4px)] backdrop-blur">
          <div className="grid grid-cols-4 gap-2">
            {mobileTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = mobileTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMobileTab(tab.id)}
                  className={`inline-flex flex-col items-center justify-center gap-0.5 rounded-[14px] px-2 py-1.5 text-[11px] font-body transition-colors ${
                    isActive ? 'bg-[#f0eadb] text-[#5a5549]' : 'text-[#8a8377]'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      </div>

      <div className="hidden lg:block">
      <ActionPlanOverview
        completionPercent={completionPercent}
        notStartedCount={notStartedCount}
        completedCount={completedCount}
        inProgressCount={inProgressCount}
        skippedCount={skippedCount}
        nextFocus={nextFocus}
        nextFocusFirstMove={nextFocusGuidance?.firstMove ?? null}
        emptyFocusTitle={emptyFocusTitle}
        emptyFocusMessage={emptyFocusMessage}
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
            {skippedRecommendations.length > 0 && (
              <a
                href="#skipped-steps"
                className="inline-flex items-center gap-2 rounded-full border border-[#ddd3bf] bg-[#fffdf8] px-4 py-2 text-sm text-[#5a5549] font-body transition-colors hover:border-[#7f7a57] hover:text-[#504b40]"
              >
                Skipped
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
              There are no active steps left right now. Review completed or skipped items below, or retake the intake if your situation has changed.
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

        {skippedRecommendations.length > 0 && (
          <details
            id="skipped-steps"
            className="rounded-[28px] border border-[#ddd5c8] bg-[#f7f4ef] px-5 py-5 shadow-[0_22px_55px_-45px_rgba(54,44,28,0.5)]"
          >
            <summary className="cursor-pointer list-none">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ece6dd] text-[#726a5f]">
                    <CircleOff size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#7d7569] font-body">
                      Skipped steps
                    </p>
                    <h3 className="mt-1 font-heading text-xl text-text-main">
                      {skippedRecommendations.length} step{skippedRecommendations.length === 1 ? '' : 's'} skipped for now
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-[#696356] font-body">
                  Use skip when a suggestion does not fit right now. It will not count against progress.
                </p>
              </div>
            </summary>

            <div className="mt-4 space-y-4">
              {skippedRecommendations.map(({ action, entry }) => {
                const guidance = getActionPlanGuidance(action.id);

                return (
                  <div
                    key={action.id}
                    className="rounded-[24px] border border-[#e0d8cb] bg-white px-4 py-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center rounded-full border border-[#e2dbcf] bg-[#f5f2ec] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#726a5f] font-body">
                            Skipped
                          </span>
                        </div>
                        <h4 className="mt-3 font-heading text-2xl text-text-main">{action.title}</h4>
                        <p className="mt-2 text-sm text-[#625e53] font-body leading-relaxed">
                          {guidance.firstMove}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-[#8a8377] font-body">
                          {entry?.updatedAt ? formatRelativeUpdate(entry.updatedAt) : 'Skipped'}
                        </p>
                        <button
                          type="button"
                          onClick={() => updateActionStatus(action.id, 'not-started')}
                          className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#d5cfaf] bg-white px-4 py-2 text-sm text-[#5a5549] font-body hover:border-[#7f7a57] hover:text-[#504b40] transition-colors"
                        >
                          <RotateCcw size={14} />
                          Restore step
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
      </div>

      {hasLongPlan && (
        <a
          href="#plan-map"
          className="fixed bottom-5 right-5 z-40 hidden items-center gap-2 rounded-full border border-[#d5cfaf] bg-[#6d6b47] px-4 py-3 text-sm text-white shadow-[0_18px_40px_-24px_rgba(54,44,28,0.75)] transition-colors hover:bg-[#5a583a] focus:outline-none focus:ring-2 focus:ring-[#7f7a57]/30 lg:inline-flex"
        >
          <ArrowUp size={15} />
          Back to plan map
        </a>
      )}
    </div>
  );
}
