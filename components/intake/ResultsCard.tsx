'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  ArrowUp,
  BellRing,
  CheckCircle2,
  CircleOff,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  LogOut,
  Map,
  MapPin,
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
import { getLocationMatch, LOCAL_PILOT_SUMMARY } from '@/lib/localResources';
import { buildReminderItems } from '@/lib/reminders';
import {
  ActionPlanProgressEntry,
  ActionPlanProgressMap,
  ActionPlanStatus,
  AppLocale,
  DocumentAnalysisEntry,
  IntakeStep,
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
  locale: AppLocale;
  intakeSteps: IntakeStep[];
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

const fieldLabelsKr: Record<string, string> = {
  childAge: '자녀 나이',
  diagnosedBy: '진단/평가 상태',
  diagnoses: '진단명 또는 어려움',
  currentSupport: '현재 지원',
  topConcerns: '가장 큰 걱정',
  freeText: '추가 상황',
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
type MobileTab = 'plan' | 'tools';

const FEEDBACK_EMAIL = 'soldisn2025@gmail.com';
const FEEDBACK_MAILTO = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('NextStep feedback')}`;

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

function FeedbackCard({ mobile = false, locale = 'en-US' as AppLocale }: { mobile?: boolean; locale?: AppLocale }) {
  const isKorean = locale === 'ko-KR';
  return (
    <div
      className={`rounded-[28px] border border-[#d7dfd0] bg-[linear-gradient(180deg,rgba(247,251,246,0.98),rgba(239,246,241,0.98))] shadow-[0_20px_55px_-45px_rgba(54,44,28,0.38)] ${
        mobile ? 'px-4 py-4' : 'px-5 py-5'
      }`}
    >
      <p className="text-xs uppercase tracking-[0.18em] text-[#6f7f6c] font-body">
        {isKorean ? 'NextStep 개선에 참여하기' : 'Help improve NextStep'}
      </p>
      <h3 className="mt-2 font-heading text-2xl text-text-main">
        {isKorean ? '여러분의 의견이 큰 도움이 됩니다.' : 'Your feedback helps shape what comes next.'}
      </h3>
      <p className="mt-3 text-sm text-[#625e53] font-body leading-relaxed">
        {isKorean
          ? '헷갈린 부분, 도움이 된 것, 아쉬운 점 — 짧게라도 알려주시면 비슷한 상황의 가족들에게 더 나은 앱을 만드는 데 반영됩니다.'
          : 'If something felt confusing, missing, or especially helpful, please send a note. Even a short message helps make this calmer and more useful for other families.'}
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <a
          href={FEEDBACK_MAILTO}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#ddd3bf] bg-white px-4 py-2 text-sm text-[#5a5549] font-body transition-colors hover:border-[#7f7a57] hover:text-[#504b40]"
        >
          <Mail size={14} />
          {isKorean ? '피드백 이메일 보내기' : 'Email feedback'}
        </a>
      </div>
    </div>
  );
}

export default function ResultsCard({
  answers,
  locale,
  intakeSteps,
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
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [showMobileAuthSheet, setShowMobileAuthSheet] = useState(false);
  const [mobileAuthEmail, setMobileAuthEmail] = useState(accountEmail ?? '');
  const [mobileAuthError, setMobileAuthError] = useState('');
  const [isSubmittingMobileAuth, setIsSubmittingMobileAuth] = useState(false);
  const [showFocusReadyBanner, setShowFocusReadyBanner] = useState(false);

  useEffect(() => {
    setZipInput(savedZip);
  }, [savedZip]);

  useEffect(() => {
    if (accountEmail) {
      setMobileAuthEmail(accountEmail);
    }
  }, [accountEmail]);

  const locationMatch = useMemo(() => getLocationMatch(savedZip, locale), [savedZip, locale]);
  const hasSupportedRegion = Boolean(locationMatch && locationMatch.regionIds.length > 0);
  const localizedFieldLabels = locale === 'ko-KR' ? fieldLabelsKr : fieldLabels;

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
  const [mobileTab, setMobileTab] = useState<MobileTab>('plan');
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
  const isKorean = locale === 'ko-KR';
  const weeklyCheckInKrLabel =
    weeklyCheckInState.daysSince === null
      ? '아직 체크인하지 않았습니다.'
      : weeklyCheckInState.daysSince >= 7
        ? `마지막 체크인이 ${weeklyCheckInState.daysSince}일 전입니다.`
        : weeklyCheckInState.daysSince === 0
          ? '오늘 체크인했습니다.'
          : `${weeklyCheckInState.daysSince}일 전에 체크인했습니다.`;
  const workspacePanels: Array<{
    id: WorkspacePanel;
    label: string;
    summary: string;
    countLabel: string;
    icon: typeof BellRing;
  }> = [
    {
      id: 'reminders',
      label: isKorean ? '알림' : 'Reminders',
      summary: isKorean
        ? overdueFollowUpCount > 0
          ? `기한 초과된 추적 항목 ${overdueFollowUpCount}개가 있습니다.`
          : dueSoonCount > 0
            ? `이번 주 추적 항목 ${dueSoonCount}개가 있습니다.`
            : reminderItems.length > 0
              ? '추적 항목이 예정되어 있습니다.'
              : '예정된 추적 항목이 없습니다.'
        : overdueFollowUpCount > 0
          ? `${overdueFollowUpCount} overdue follow-up${overdueFollowUpCount === 1 ? '' : 's'} need attention.`
          : dueSoonCount > 0
            ? `${dueSoonCount} follow-up${dueSoonCount === 1 ? '' : 's'} are due this week.`
            : reminderItems.length > 0
              ? 'Follow-ups are scheduled and ready when you need them.'
              : 'No follow-ups scheduled yet.',
      countLabel: isKorean ? `${reminderItems.length}개 예정` : `${reminderItems.length} scheduled`,
      icon: BellRing,
    },
    {
      id: 'check-in',
      label: isKorean ? '주간 리셋' : 'Weekly reset',
      summary: isKorean ? weeklyCheckInKrLabel : weeklyCheckInState.label,
      countLabel: isKorean
        ? weeklyCheckInState.daysSince === null ? '아직 체크인 안 됨' : `업데이트 후 ${weeklyCheckInState.daysSince}일`
        : weeklyCheckInState.daysSince === null ? 'Not checked in yet' : `${weeklyCheckInState.daysSince}d since update`,
      icon: RefreshCcw,
    },
    {
      id: 'documents',
      label: isKorean ? '서류 도구' : 'Paperwork tool',
      summary: isKorean
        ? documentAnalyses.length > 0
          ? `저장된 서류 분석 ${documentAnalyses.length}개를 다시 볼 수 있습니다.`
          : '이메일, 보고서, 거부 서신을 붙여넣어 분석하세요.'
        : documentAnalyses.length > 0
          ? `${documentAnalyses.length} saved document analys${documentAnalyses.length === 1 ? 'is' : 'es'} ready to revisit.`
          : 'Analyze pasted emails, reports, or denial letters when they show up.',
      countLabel: isKorean
        ? documentAnalyses.length > 0 ? `${documentAnalyses.length}개 저장됨` : '준비됨'
        : documentAnalyses.length > 0 ? `${documentAnalyses.length} saved` : 'Ready when needed',
      icon: FileText,
    },
  ];
  // A panel is considered usable if it doesn't depend on an unsupported browser feature.
  // Currently only the browser-alerts section within Reminders depends on notification support,
  // but the Reminders panel itself (follow-up tracking, calendar export) always works.
  // Weekly Reset and Paperwork Tool are always available.
  // The Tools tab is hidden only if every workspace panel becomes unavailable.
  const usableWorkspacePanelIds = new Set<WorkspacePanel>(['reminders', 'check-in', 'documents']);
  const hasUsableToolsPanels = usableWorkspacePanelIds.size > 0;

  const allMobileTabs: Array<{
    id: MobileTab;
    label: string;
    icon: typeof Target;
  }> = [
    { id: 'plan', label: isKorean ? '내 계획' : 'My Plan', icon: Map },
    { id: 'tools', label: isKorean ? '도구 모음' : 'Tools', icon: BellRing },
  ];
  const mobileTabs = allMobileTabs.filter(
    (tab) => tab.id !== 'tools' || hasUsableToolsPanels
  );

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
  const selectedMobilePlanIndex = selectedMobileRecommendation
    ? recommendationsWithState.findIndex(
        ({ action }) => action.id === selectedMobileRecommendation.action.id
      )
    : -1;
  const showMobileSyncCta = isConfigured && !isLoading && !user;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const hasSeenBanner =
      window.sessionStorage.getItem('nextstep-focus-ready-banner-seen') === '1';

    if (hasSeenBanner) {
      return;
    }

    setShowFocusReadyBanner(true);
    window.sessionStorage.setItem('nextstep-focus-ready-banner-seen', '1');

    const timeout = window.setTimeout(() => {
      setShowFocusReadyBanner(false);
    }, 4500);

    return () => window.clearTimeout(timeout);
  }, []);

  // If the active tab is no longer visible, fall back to plan
  useEffect(() => {
    const visibleTabIds = mobileTabs.map((t) => t.id);
    if (!visibleTabIds.includes(mobileTab)) {
      setMobileTab('plan');
    }
  }, [mobileTabs, mobileTab]);

  const handleZipSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (locale === 'ko-KR') {
      const normalizedRegion = zipInput.trim();
      if (!normalizedRegion) {
        setZipError('지역명을 입력해 주세요.');
        return;
      }

      setZipError('');
      onSavedZipChange(normalizedRegion);
      return;
    }

    const normalized = zipInput.replace(/\D/g, '').slice(0, 5);

    if (normalized.length !== 5) {
      setZipError('Enter a valid 5-digit ZIP code.');
      return;
    }

    setZipError('');
    onSavedZipChange(normalized);
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('GPS is not supported by your browser — please enter your ZIP manually.');
      return;
    }
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`/api/reverse-geocode?lat=${latitude}&lng=${longitude}`);
          const data = await res.json();
          if (!res.ok || !data.zip) {
            setGpsError('Could not determine your ZIP — please enter it manually.');
            return;
          }
          setZipInput(data.zip);
          setZipError('');
          onSavedZipChange(data.zip);
        } catch {
          setGpsError('Could not determine your ZIP — please enter it manually.');
        } finally {
          setGpsLoading(false);
        }
      },
      () => {
        setGpsError('Location access denied — please enter your ZIP manually.');
        setGpsLoading(false);
      }
    );
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

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative lg:max-w-5xl lg:mx-auto lg:px-4 lg:py-8 lg:pb-28">
      <div className="fixed inset-0 z-40 bg-background lg:hidden">
        <div className="flex h-[100dvh] flex-col pt-[env(safe-area-inset-top)]">
          <div className="border-b border-gray-100 bg-white px-4 py-3 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <span className="font-heading text-lg font-bold text-primary">NextStep</span>
              <div className="flex shrink-0 items-center gap-2">
                {isLoading ? (
                  <div className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] text-gray-500 font-body">
                    <RefreshCcw size={12} className="animate-spin" />
                  </div>
                ) : user ? (
                  <button
                    type="button"
                    onClick={() => setShowMobileAuthSheet(true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-primary font-body"
                  >
                    <UserRound size={12} />
                    {isKorean ? '계정' : 'Account'}
                  </button>
                ) : null}
                {user && (
                  <div className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary font-body">
                    {completionPercent}%
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-[calc(env(safe-area-inset-bottom)+64px)] pt-3">
            <div className="space-y-4">
          {mobileTab === 'plan' && (
            <>
              {/* ── Hero: top priority action ── */}
              {selectedMobileRecommendation ? (
                <div className="rounded-2xl border-2 border-accent bg-white overflow-hidden">
                  <div className="px-4 pt-3 pb-2 bg-accent/5 border-b border-accent/20">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent font-body">
                      {isKorean ? '지금 이것부터 시작하세요' : 'Start here — top priority'}
                    </p>
                  </div>
                  <ActionPlanCard
                    action={selectedMobileRecommendation.action}
                    displayIndex={selectedMobilePlanIndex + 1}
                    savedZip={savedZip}
                    locale={locale}
                    childAge={answers.childAge}
                    diagnoses={answers.diagnoses}
                    topConcerns={answers.topConcerns}
                    entry={selectedMobileRecommendation.entry}
                    mobileMode
                    focusMode
                    loadProviderSearch
                    onUpdateStatus={updateActionStatus}
                    onUpdateEntry={onUpdateActionEntry}
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-success/30 bg-success/10 px-4 py-4">
                  <p className="text-sm font-semibold text-success font-body">{emptyFocusTitle}</p>
                  <p className="mt-1 text-sm text-gray-600 font-body leading-relaxed">{emptyFocusMessage}</p>
                </div>
              )}

              {/* ── Save plan CTA (not signed in) ── */}
              {showMobileSyncCta && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowMobileAuthSheet(true)}
                    className="text-sm font-semibold text-primary hover:underline underline-offset-2 transition-colors font-body"
                  >
                    {isKorean ? '이 계획 저장하기 → 로그인' : 'Save your plan → Sign in'}
                  </button>
                </div>
              )}

              {/* ── Location search ── */}
              {!savedZip && (
                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400 font-body mb-2">
                    {locale === 'ko-KR' ? '지역 기반 검색' : 'Find nearby providers'}
                  </p>
                  <p className="mb-3 text-sm text-gray-500 font-body leading-relaxed">
                    {locale === 'ko-KR'
                      ? '지역명을 입력하면 각 단계에 맞는 네이버 지도 검색 링크를 보여줍니다.'
                      : 'Enter your ZIP code to see local therapists and services for each step.'}
                  </p>
                  {locale === 'en-US' && (
                    <button
                      type="button"
                      onClick={handleUseLocation}
                      disabled={gpsLoading}
                      className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 font-body disabled:opacity-60"
                    >
                      <MapPin size={15} />
                      {gpsLoading ? (isKorean ? '위치 가져오는 중...' : 'Getting your location...') : (isKorean ? '현재 위치 사용' : 'Use my location')}
                    </button>
                  )}
                  <form onSubmit={handleZipSubmit} className="flex gap-2">
                    <input
                      inputMode={locale === 'ko-KR' ? 'text' : 'numeric'}
                      autoComplete={locale === 'ko-KR' ? 'address-level2' : 'postal-code'}
                      maxLength={locale === 'ko-KR' ? 40 : 5}
                      value={zipInput}
                      onChange={(event) => {
                        setZipError('');
                        setZipInput(
                          locale === 'ko-KR'
                            ? event.target.value.slice(0, 40)
                            : event.target.value.replace(/\D/g, '').slice(0, 5)
                        );
                      }}
                      placeholder={locale === 'ko-KR' ? '예: 서울 강남' : 'ZIP code'}
                      aria-label={locale === 'ko-KR' ? '지역명 입력' : 'Enter ZIP code to find nearby providers'}
                      className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-text-main font-body outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white font-body"
                    >
                      {locale === 'ko-KR' ? '검색' : 'Search'}
                    </button>
                  </form>
                  {(zipError || gpsError) && (
                    <p className="mt-2 text-sm text-red-500 font-body">{zipError || gpsError}</p>
                  )}
                </div>
              )}

              {/* ── Progress bar ── */}
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400 font-body uppercase tracking-[0.12em]">
                    {isKorean ? '전체 진행도' : 'Progress'}
                  </span>
                  <span className="text-xs font-bold text-primary font-body">{completionPercent}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-success transition-all duration-500"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="font-heading text-lg font-bold text-text-main">{notStartedCount}</p>
                    <p className="text-[10px] text-gray-400 font-body">{isKorean ? '미시작' : 'To do'}</p>
                  </div>
                  <div>
                    <p className="font-heading text-lg font-bold text-amber-600">{inProgressCount}</p>
                    <p className="text-[10px] text-gray-400 font-body">{isKorean ? '진행 중' : 'In progress'}</p>
                  </div>
                  <div>
                    <p className="font-heading text-lg font-bold text-success">{completedCount}</p>
                    <p className="text-[10px] text-gray-400 font-body">{isKorean ? '완료' : 'Done'}</p>
                  </div>
                  <div>
                    <p className="font-heading text-lg font-bold text-gray-400">{skippedCount}</p>
                    <p className="text-[10px] text-gray-400 font-body">{isKorean ? '건너뜀' : 'Skipped'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-[#ddd3bf] bg-white/90 px-4 py-4 shadow-[0_18px_42px_-34px_rgba(54,44,28,0.45)]">
                <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
                  {locale === 'ko-KR' ? '지역 도움' : 'Local help'}
                </p>
                <form onSubmit={handleZipSubmit} className="mt-3 space-y-3">
                  {locale === 'en-US' && (
                    <button
                      type="button"
                      onClick={handleUseLocation}
                      disabled={gpsLoading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] border border-[#ddd3bf] bg-[#fffdf8] px-4 py-3 text-sm text-[#5a5549] font-body disabled:opacity-60"
                    >
                      <MapPin size={15} />
                      {gpsLoading ? 'Getting your location...' : 'Use my location'}
                    </button>
                  )}
                  <input
                    inputMode={locale === 'ko-KR' ? 'text' : 'numeric'}
                    autoComplete={locale === 'ko-KR' ? 'address-level2' : 'postal-code'}
                    maxLength={locale === 'ko-KR' ? 40 : 5}
                    value={zipInput}
                    onChange={(event) => {
                      setZipError('');
                      setZipInput(
                        locale === 'ko-KR'
                          ? event.target.value.slice(0, 40)
                          : event.target.value.replace(/\D/g, '').slice(0, 5)
                      );
                    }}
                    placeholder={locale === 'ko-KR' ? '예: 서울 강남' : 'ZIP code'}
                    className="w-full rounded-[18px] border border-[#ddd3bf] bg-[#fffdf8] px-4 py-3 text-sm text-text-main font-body outline-none transition-all focus:border-[#7f7a57] focus:ring-2 focus:ring-[#7f7a57]/15"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-[18px] bg-[#6d6b47] px-4 py-3 text-sm text-white font-body"
                    >
                      {locale === 'ko-KR' ? '지역 도움 보기' : 'Show local help'}
                    </button>
                    {savedZip && (
                      <button
                        type="button"
                        onClick={handleClearZip}
                        className="rounded-[18px] border border-[#ddd3bf] px-4 py-3 text-sm text-[#625e53] font-body"
                      >
                        {locale === 'ko-KR' ? '지우기' : 'Clear'}
                      </button>
                    )}
                  </div>
                </form>
                {(zipError || gpsError) && (
                  <p className="mt-2 text-sm text-red-500 font-body">{zipError || gpsError}</p>
                )}
                {!zipError && !gpsError && savedZip && hasSupportedRegion && locationMatch?.primaryRegionLabel && (
                  <p className="mt-3 text-sm text-success font-body">
                    {locale === 'ko-KR'
                      ? `${locationMatch.primaryRegionLabel} 기준 검색 링크를 준비했습니다.`
                      : `Showing curated local resources for ${locationMatch.primaryRegionLabel}.`}
                  </p>
                )}
                {!zipError && savedZip && !hasSupportedRegion && (
                  <p className="mt-3 text-sm text-amber-700 font-body">
                    {locale === 'ko-KR'
                      ? `${savedZip}에 대한 직접 선별 자료는 아직 없지만, 네이버 지도 검색 링크는 사용할 수 있습니다.`
                      : `Curated programs are not available for ZIP ${savedZip} yet, but provider search still works.`}
                  </p>
                )}
                <p className="mt-3 text-xs text-[#8a8377] font-body leading-relaxed">
                  {LOCAL_PILOT_SUMMARY[locale]}
                </p>
              </div>

              {/* ── Other active steps ── */}
              {activeRecommendations.length > 1 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 font-body mb-2 px-1">
                    {isKorean ? '나머지 단계' : 'Other steps'}
                  </p>
                  <div className="space-y-2">
                    {activeRecommendations.slice(1).map(({ action, entry, status }, index) => {
                      const followUpState = getFollowUpState(entry.nextFollowUpDate, status);
                      const isSelected = action.id === selectedMobileActionId;

                      return (
                        <button
                          key={action.id}
                          type="button"
                          onClick={() => openMobileAction(action.id)}
                          className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                            isSelected
                              ? 'border-primary/30 bg-primary/5'
                              : 'border-gray-200 bg-white hover:border-primary/20'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="font-body text-sm font-semibold text-text-main truncate">
                                {action.title}
                              </h3>
                              <p className="mt-0.5 text-xs text-gray-400 font-body">{followUpState.label}</p>
                            </div>
                            <span
                              className={`inline-flex flex-shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold font-body ${planMapStatusMeta[status].className}`}
                            >
                              {planMapStatusMeta[status].label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── History (collapsed) ── */}
              {(completedRecommendations.length > 0 || skippedRecommendations.length > 0) && (
                <details className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-gray-500 font-body flex items-center justify-between">
                    <span>
                      {isKorean
                        ? `완료 및 건너뜀 (${completedCount + skippedCount})`
                        : `Completed & skipped (${completedCount + skippedCount})`}
                    </span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </summary>
                  <div className="mt-3 space-y-2">
                    {completedRecommendations.map(({ action, entry }) => (
                      <div key={action.id} className="rounded-xl border border-success/20 bg-success/5 px-3 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-body text-sm font-semibold text-text-main">{action.title}</h4>
                          <span className="text-[10px] font-bold text-success font-body flex-shrink-0">
                            {isKorean ? '완료' : 'Done'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-400 font-body">
                          {entry?.updatedAt ? formatRelativeUpdate(entry.updatedAt) : (isKorean ? '완료됨' : 'Completed')}
                        </p>
                        <button
                          type="button"
                          onClick={() => updateActionStatus(action.id, 'not-started')}
                          className="mt-2 inline-flex items-center gap-1.5 text-xs text-gray-400 font-body hover:text-primary transition-colors"
                        >
                          <RotateCcw size={11} />
                          {isKorean ? '다시 시작' : 'Reopen'}
                        </button>
                      </div>
                    ))}
                    {skippedRecommendations.map(({ action, entry }) => (
                      <div key={action.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-body text-sm font-semibold text-gray-500">{action.title}</h4>
                          <span className="text-[10px] font-bold text-gray-400 font-body flex-shrink-0">
                            {isKorean ? '건너뜀' : 'Skipped'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateActionStatus(action.id, 'not-started')}
                          className="mt-2 inline-flex items-center gap-1.5 text-xs text-gray-400 font-body hover:text-primary transition-colors"
                        >
                          <RotateCcw size={11} />
                          {isKorean ? '복원' : 'Restore'}
                        </button>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* ── Intake review + start over ── */}
              <details className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <summary className="cursor-pointer list-none text-sm text-gray-400 font-body">
                  {isKorean ? '입력 내용 확인' : 'Review intake answers'}
                </summary>
                <div className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
                  {intakeSteps.map((step) => {
                    const val = answers[step.fieldName as keyof IntakeAnswers];
                    const isEmpty = !val || (Array.isArray(val) && val.length === 0) || val === '';
                    if (isEmpty && step.optional) return null;
                    return (
                      <div key={step.fieldName} className="px-3 py-2.5">
                        <p className="text-[10px] text-gray-400 font-body mb-0.5">{localizedFieldLabels[step.fieldName]}</p>
                        <p className="text-sm text-text-main font-body">
                          {Array.isArray(val) ? val.join(', ') : val || '-'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </details>

              <div className="flex justify-center pt-1 pb-2">
                <button
                  onClick={onStartOver}
                  aria-label="Start over and retake the questionnaire"
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary transition-colors font-body"
                >
                  <ArrowLeft size={14} />
                  {isKorean ? '처음부터 다시' : 'Start over'}
                </button>
              </div>

              <FeedbackCard mobile locale={locale} />
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
                  locale={locale}
                />
              )}

              {activeWorkspacePanel === 'documents' && (
                <DocumentActionPanel
                  className=""
                  analyses={documentAnalyses}
                  onSaveAnalysis={onSaveDocumentAnalysis}
                  locale={locale}
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

          <div className="border-t border-gray-100 bg-white px-3 py-2 pb-[calc(env(safe-area-inset-bottom)+6px)] backdrop-blur">
          <div className="grid grid-cols-2 gap-1">
            {mobileTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = mobileTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMobileTab(tab.id)}
                  className={`inline-flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold font-body transition-colors min-h-[52px] ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Icon size={18} />
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
        locale={locale}
        zipInput={zipInput}
        savedZip={savedZip}
        zipError={zipError}
        localPilotSummary={LOCAL_PILOT_SUMMARY[locale]}
        hasSupportedRegion={hasSupportedRegion}
        regionLabel={locationMatch?.primaryRegionLabel ?? null}
        onZipInputChange={(value) => {
          setZipError('');
          setZipInput(
            locale === 'ko-KR'
              ? value.slice(0, 40)
              : value.replace(/\D/g, '').slice(0, 5)
          );
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
              {isKorean ? '전체 단계 보기' : 'Plan map'}
            </p>
            <h3 className="mt-2 font-heading text-2xl text-text-main">
              {isKorean ? '세부 내용 열기 전에 전체 단계를 먼저 확인하세요.' : 'See the whole plan before opening the details.'}
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-[#625e53] font-body leading-relaxed">
              {isKorean
                ? '다음 단계로 바로 이동하고, 워크스페이스는 하나씩 열어 사용하세요.'
                : 'Jump straight to the next step, keep one workspace open at a time, and leave the heavy tools folded away until they are needed.'}
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

      <div id="action-list" className="mt-7 space-y-5">
        {activeRecommendations.map(({ action, entry }, index) => (
          <ActionPlanCard
            key={action.id}
            action={action}
            displayIndex={index + 1}
            savedZip={savedZip}
            locale={locale}
            childAge={answers.childAge}
            diagnoses={answers.diagnoses}
            topConcerns={answers.topConcerns}
            entry={entry}
            onUpdateStatus={updateActionStatus}
            onUpdateEntry={onUpdateActionEntry}
          />
        ))}

        {completedRecommendations.length > 0 && (
          <details
            id="completed-steps"
            className="group rounded-[28px] border border-[#d7e1c7] bg-[#f7fbf2] px-5 py-5 shadow-[0_22px_55px_-45px_rgba(54,44,28,0.65)]"
          >
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf6e7] text-[#5a754e]">
                    <Trophy size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#73856b] font-body">
                      {isKorean ? '완료된 단계' : 'Completed steps'}
                    </p>
                    <h3 className="mt-1 font-heading text-xl text-text-main">
                      {isKorean
                        ? `${completedRecommendations.length}단계 완료됨`
                        : `${completedRecommendations.length} step${completedRecommendations.length === 1 ? '' : 's'} marked done`}
                    </h3>
                  </div>
                </div>
                <ChevronDown size={18} className="shrink-0 text-[#8a8377] transition-transform duration-200 group-open:rotate-180" />
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
                            {isKorean ? '완료' : 'Done'}
                          </span>
                        </div>
                        <h4 className="mt-3 font-heading text-2xl text-text-main">{action.title}</h4>
                        <p className="mt-2 text-sm text-[#625e53] font-body leading-relaxed">
                          {guidance.firstMove}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-[#8a8377] font-body">
                          {entry?.updatedAt ? formatRelativeUpdate(entry.updatedAt) : (isKorean ? '완료됨' : 'Completed')}
                        </p>
                        <button
                          type="button"
                          onClick={() => updateActionStatus(action.id, 'not-started')}
                          className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#d5cfaf] bg-white px-4 py-2 text-sm text-[#5a5549] font-body hover:border-[#7f7a57] hover:text-[#504b40] transition-colors"
                        >
                          <RotateCcw size={14} />
                          {isKorean ? '다시 시작' : 'Reopen step'}
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
            className="group rounded-[28px] border border-[#ddd5c8] bg-[#f7f4ef] px-5 py-5 shadow-[0_22px_55px_-45px_rgba(54,44,28,0.5)]"
          >
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ece6dd] text-[#726a5f]">
                    <CircleOff size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#7d7569] font-body">
                      {isKorean ? '건너뛴 단계' : 'Skipped steps'}
                    </p>
                    <h3 className="mt-1 font-heading text-xl text-text-main">
                      {isKorean
                        ? `${skippedRecommendations.length}단계 건너뜀`
                        : `${skippedRecommendations.length} step${skippedRecommendations.length === 1 ? '' : 's'} skipped for now`}
                    </h3>
                  </div>
                </div>
                <ChevronDown size={18} className="shrink-0 text-[#8a8377] transition-transform duration-200 group-open:rotate-180" />
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
                            {isKorean ? '건너뜀' : 'Skipped'}
                          </span>
                        </div>
                        <h4 className="mt-3 font-heading text-2xl text-text-main">{action.title}</h4>
                        <p className="mt-2 text-sm text-[#625e53] font-body leading-relaxed">
                          {guidance.firstMove}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-[#8a8377] font-body">
                          {entry?.updatedAt ? formatRelativeUpdate(entry.updatedAt) : (isKorean ? '건너뜀' : 'Skipped')}
                        </p>
                        <button
                          type="button"
                          onClick={() => updateActionStatus(action.id, 'not-started')}
                          className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#d5cfaf] bg-white px-4 py-2 text-sm text-[#5a5549] font-body hover:border-[#7f7a57] hover:text-[#504b40] transition-colors"
                        >
                          <RotateCcw size={14} />
                          {isKorean ? '복원' : 'Restore step'}
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
        id="plan-tools"
        className="group mt-8 rounded-[28px] border border-[#ddd3bf] bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(247,243,235,0.96))] px-5 py-5 shadow-[0_22px_55px_-45px_rgba(54,44,28,0.55)]"
      >
        <summary className="cursor-pointer list-none">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f3eee3] text-[#7a724b]">
                <Target size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
                  {isKorean ? '플랜 도구' : 'Plan tools'}
                </p>
                <h3 className="mt-1 font-heading text-xl text-text-main">
                  {isKorean ? '알림, 주간 리셋, 서류 지원' : 'Reminders, weekly reset, and paperwork support'}
                </h3>
              </div>
            </div>
            <ChevronDown size={18} className="shrink-0 text-[#8a8377] transition-transform duration-200 group-open:rotate-180" />
          </div>
        </summary>

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
                      {isKorean ? '열림' : 'Open'}
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

        {activeWorkspacePanel === 'reminders' && (
          <ReminderCenter
            className="mt-4"
            items={activeRecommendations.map(({ action, entry }) => ({ action, entry }))}
            locale={locale}
          />
        )}

        {activeWorkspacePanel === 'documents' && (
          <DocumentActionPanel
            className="mt-4"
            analyses={documentAnalyses}
            onSaveAnalysis={onSaveDocumentAnalysis}
            locale={locale}
          />
        )}

        {activeWorkspacePanel === 'check-in' && (
          <WeeklyCheckInPanel
            className="mt-4"
            checkIn={weeklyCheckIn}
            locale={locale}
            activeRecommendations={activeRecommendations.map(({ action }) => action)}
            dueFollowUpCount={dueSoonCount}
            overdueFollowUpCount={overdueFollowUpCount}
            currentFocusActionId={nextFocus?.id ?? null}
            onSave={onWeeklyCheckInChange}
          />
        )}
      </details>

      <details
        id="intake-details"
        className="group mt-8 rounded-[28px] border border-[#ddd3bf] bg-white/75 px-5 py-5 shadow-[0_20px_55px_-48px_rgba(54,44,28,0.65)]"
      >
        <summary className="cursor-pointer list-none select-none">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf4ff] text-primary">
                <ClipboardList size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
                  {isKorean ? '입력한 내용' : 'Intake details'}
                </p>
                <h3 className="mt-1 font-heading text-xl text-text-main">
                  {isKorean ? '입력한 답변 확인' : 'Review your answers'}
                </h3>
              </div>
            </div>
            <ChevronDown size={18} className="shrink-0 text-[#8a8377] transition-transform duration-200 group-open:rotate-180" />
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
                <p className="text-xs text-[#8a8377] font-body mb-1">{localizedFieldLabels[step.fieldName]}</p>
                <p className="text-sm text-text-main font-body">
                  {Array.isArray(val) ? val.join(', ') : val || '-'}
                </p>
              </div>
            );
          })}
        </div>
      </details>

      <div className="mt-6">
        <FeedbackCard locale={locale} />
      </div>

      <div className="mt-8 rounded-[30px] border border-[#e3dac9] bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(244,239,231,0.95))] px-6 py-8 text-center shadow-[0_22px_55px_-50px_rgba(54,44,28,0.6)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3eee3] text-[#7a724b]">
          <CheckCircle2 size={20} />
        </div>
        <h3 className="mt-4 font-heading text-2xl text-text-main">
          {isKorean ? '내 아이를 위한 의미있는 계획의 시작' : 'You are building a real plan.'}
        </h3>
        <p className="mt-3 max-w-2xl mx-auto text-sm text-[#625e53] font-body leading-relaxed">
          {isKorean
            ? '계획을 단순하게 유지하고, 한 번에 한 단계씩, 통화나 방문 후 돌아와서 진행 상황을 업데이트하세요.'
            : 'Keep the plan simple, work one step at a time, and come back after calls or appointments to mark progress. This journey is heavy enough without forcing everything into one day.'}
        </p>
      </div>

      <p className="mt-8 text-xs text-[#8a8377] font-body text-center leading-relaxed">
        {isKorean
          ? '이 권장 사항은 입력한 답변을 바탕으로 한 일반적인 가이드이며, 의학적 또는 치료적 조언이 아닙니다. 항상 전문가와 상담하세요.'
          : 'These recommendations are general guidance based on your answers and do not constitute medical or therapeutic advice. Always consult a qualified professional.'}
      </p>

      <div className="mt-6 flex justify-center">
        <button
          onClick={onStartOver}
          aria-label="Start over and retake the questionnaire"
          className="flex items-center gap-1.5 text-sm text-[#7e786c] hover:text-primary transition-colors font-body"
        >
          <ArrowLeft size={14} />
          {isKorean ? '처음부터 다시' : 'Start over'}
        </button>
      </div>
      </div>

      <a
        href="#plan-map"
        className="fixed bottom-5 right-5 z-40 hidden items-center gap-2 rounded-full border border-[#d5cfaf] bg-[#6d6b47] px-4 py-3 text-sm text-white shadow-[0_18px_40px_-24px_rgba(54,44,28,0.75)] transition-colors hover:bg-[#5a583a] focus:outline-none focus:ring-2 focus:ring-[#7f7a57]/30 lg:inline-flex"
      >
        <ArrowUp size={15} />
        {isKorean ? '계획 지도로 돌아가기' : 'Back to plan map'}
      </a>
    </div>
  );
}
