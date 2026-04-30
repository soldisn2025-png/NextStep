'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSupabaseAuth } from '@/components/providers/SupabaseAuthProvider';
import StepWrapper from '@/components/intake/StepWrapper';
import QuestionCard from '@/components/intake/QuestionCard';
import TextInputStep from '@/components/intake/TextInputStep';
import ResultsCard from '@/components/intake/ResultsCard';
import { intakeSteps } from '@/lib/intakeSteps';
import { intakeStepsKr } from '@/lib/intakeStepsKr';
import { isAppLocale, writeStoredLocale } from '@/lib/locale';
import {
  getEmptyPlanSnapshot,
  isPlanSnapshotEmpty,
  PersistedPlanSnapshot,
  readLocalPlanSnapshot,
  writeLocalPlanSnapshot,
} from '@/lib/planSnapshot';
import { PlanSyncStatus } from '@/lib/types';
import { getRecommendations } from '@/lib/rulesEngine';
import {
  fetchRemotePlanSnapshot,
  saveRemotePlanSnapshot,
} from '@/lib/supabase/planSync';

export default function IntakePage() {
  const { user, isConfigured } = useSupabaseAuth();
  const [plan, setPlan] = useState<PersistedPlanSnapshot>(getEmptyPlanSnapshot());
  const [isHydrated, setIsHydrated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<PlanSyncStatus>(
    isConfigured ? 'signed-out' : 'not-configured'
  );
  const latestPlanRef = useRef(plan);
  const hasResolvedRemoteRef = useRef(false);
  const lastSyncedPlanUpdatedAtRef = useRef('');

  useEffect(() => {
    latestPlanRef.current = plan;
  }, [plan]);

  useEffect(() => {
    const localPlan = readLocalPlanSnapshot();
    const queryLocale =
      typeof window === 'undefined'
        ? null
        : new URLSearchParams(window.location.search).get('locale');
    if (isAppLocale(queryLocale) && queryLocale !== localPlan.locale) {
      writeStoredLocale(queryLocale);
      setPlan({
        ...getEmptyPlanSnapshot(),
        locale: queryLocale,
        planUpdatedAt: new Date().toISOString(),
      });
      setIsHydrated(true);
      return;
    }

    setPlan(localPlan);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    writeLocalPlanSnapshot(plan);
  }, [isHydrated, plan]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!isConfigured) {
      hasResolvedRemoteRef.current = false;
      lastSyncedPlanUpdatedAtRef.current = '';
      setSyncStatus('not-configured');
      return;
    }

    if (!user) {
      hasResolvedRemoteRef.current = false;
      lastSyncedPlanUpdatedAtRef.current = '';
      setSyncStatus('signed-out');
      return;
    }

    let cancelled = false;

    const resolveInitialSync = async () => {
      setSyncStatus('syncing');

      try {
        const remotePlan = await fetchRemotePlanSnapshot(user.id);
        if (cancelled) {
          return;
        }

        const localPlan = latestPlanRef.current;

        if (!remotePlan) {
          if (!isPlanSnapshotEmpty(localPlan) && localPlan.planUpdatedAt) {
            await saveRemotePlanSnapshot(user.id, localPlan);
            if (cancelled) {
              return;
            }
            lastSyncedPlanUpdatedAtRef.current = localPlan.planUpdatedAt;
          } else {
            lastSyncedPlanUpdatedAtRef.current = '';
          }

          hasResolvedRemoteRef.current = true;
          setSyncStatus('synced');
          return;
        }

        const localTimestamp = localPlan.planUpdatedAt
          ? new Date(localPlan.planUpdatedAt).getTime()
          : 0;
        const remoteTimestamp = remotePlan.planUpdatedAt
          ? new Date(remotePlan.planUpdatedAt).getTime()
          : 0;

        if (
          remoteTimestamp > localTimestamp ||
          (isPlanSnapshotEmpty(localPlan) && !isPlanSnapshotEmpty(remotePlan))
        ) {
          lastSyncedPlanUpdatedAtRef.current = remotePlan.planUpdatedAt;
          setPlan(remotePlan);
        } else if (localTimestamp > remoteTimestamp) {
          await saveRemotePlanSnapshot(user.id, localPlan);
          if (cancelled) {
            return;
          }
          lastSyncedPlanUpdatedAtRef.current = localPlan.planUpdatedAt;
        } else {
          lastSyncedPlanUpdatedAtRef.current =
            remotePlan.planUpdatedAt || localPlan.planUpdatedAt;
        }

        hasResolvedRemoteRef.current = true;
        setSyncStatus('synced');
      } catch {
        if (!cancelled) {
          hasResolvedRemoteRef.current = true;
          setSyncStatus('error');
        }
      }
    };

    void resolveInitialSync();

    return () => {
      cancelled = true;
    };
  }, [isConfigured, isHydrated, user]);

  useEffect(() => {
    if (!isHydrated || !isConfigured || !user || !hasResolvedRemoteRef.current) {
      return;
    }

    if (!plan.planUpdatedAt || plan.planUpdatedAt === lastSyncedPlanUpdatedAtRef.current) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        setSyncStatus('syncing');
        const latestPlan = latestPlanRef.current;
        await saveRemotePlanSnapshot(user.id, latestPlan);
        lastSyncedPlanUpdatedAtRef.current = latestPlan.planUpdatedAt;
        setSyncStatus('synced');
      } catch {
        setSyncStatus('error');
      }
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [isConfigured, isHydrated, plan, user]);

  const localizedIntakeSteps = plan.locale === 'ko-KR' ? intakeStepsKr : intakeSteps;
  const totalSteps = localizedIntakeSteps.length;
  const currentStep = Math.min(Math.max(plan.currentStep, 1), totalSteps);
  const step = localizedIntakeSteps[currentStep - 1];

  const updatePlan = (updater: (current: PersistedPlanSnapshot) => PersistedPlanSnapshot) => {
    setPlan((current) => ({
      ...updater(current),
      planUpdatedAt: new Date().toISOString(),
    }));
  };

  const handleSingleSelect = (fieldName: string, value: string) => {
    updatePlan((current) => {
      const nextStep = current.currentStep < totalSteps ? current.currentStep + 1 : current.currentStep;

      return {
        ...current,
        answers: {
          ...current.answers,
          [fieldName]: value,
        },
        currentStep: nextStep,
        completed: current.currentStep >= totalSteps ? true : current.completed,
      };
    });
  };

  const handleMultiSelect = (fieldName: string, value: string) => {
    updatePlan((current) => {
      const selectedValues = current.answers[fieldName as keyof typeof current.answers] as string[];
      const intakeStep = localizedIntakeSteps.find((item) => item.fieldName === fieldName);
      const maxSelections = intakeStep?.maxSelections;

      if (selectedValues.includes(value)) {
        return {
          ...current,
          answers: {
            ...current.answers,
            [fieldName]: selectedValues.filter((item) => item !== value),
          },
        };
      }

      if (maxSelections !== undefined && selectedValues.length >= maxSelections) {
        return current;
      }

      return {
        ...current,
        answers: {
          ...current.answers,
          [fieldName]: [...selectedValues, value],
        },
      };
    });
  };

  const advanceStep = () => {
    updatePlan((current) => ({
      ...current,
      currentStep: current.currentStep < totalSteps ? current.currentStep + 1 : current.currentStep,
      completed: current.currentStep >= totalSteps ? true : current.completed,
    }));
  };

  const handleBack = () => {
    updatePlan((current) => ({
      ...current,
      currentStep: current.currentStep > 1 ? current.currentStep - 1 : 1,
    }));
  };

  const handleSkip = () => {
    updatePlan((current) => ({
      ...current,
      completed: true,
    }));
  };

  const handleSubmit = () => {
    updatePlan((current) => ({
      ...current,
      completed: true,
    }));
  };

  const handleStartOver = () => {
    setPlan({
      ...getEmptyPlanSnapshot(),
      planUpdatedAt: new Date().toISOString(),
    });
  };

  const recommendations = useMemo(
    () => getRecommendations(plan.answers, plan.locale),
    [plan.answers, plan.locale]
  );

  if (plan.completed) {
    return (
      <ResultsCard
        answers={plan.answers}
        locale={plan.locale}
        intakeSteps={localizedIntakeSteps}
        recommendations={recommendations}
        savedZip={plan.savedZip}
        progress={plan.progress}
        weeklyCheckIn={plan.weeklyCheckIn}
        documentAnalyses={plan.documentAnalyses}
        syncStatus={syncStatus}
        accountEmail={user?.email ?? null}
        onSavedZipChange={(value) =>
          updatePlan((current) => ({
            ...current,
            savedZip: value,
          }))
        }
        onUpdateActionEntry={(actionId, updates) =>
          updatePlan((current) => ({
            ...current,
            progress: {
              ...current.progress,
              [actionId]: {
                ...current.progress[actionId],
                ...updates,
                status: updates.status ?? current.progress[actionId]?.status ?? 'not-started',
                updatedAt: new Date().toISOString(),
              },
            },
          }))
        }
        onWeeklyCheckInChange={(entry) =>
          updatePlan((current) => ({
            ...current,
            weeklyCheckIn: entry,
          }))
        }
        onSaveDocumentAnalysis={(entry) =>
          updatePlan((current) => ({
            ...current,
            documentAnalyses: [entry, ...current.documentAnalyses].slice(0, 8),
          }))
        }
        onStartOver={handleStartOver}
      />
    );
  }

  return (
    <StepWrapper currentStep={currentStep} totalSteps={totalSteps} onBack={handleBack} locale={plan.locale}>
      {step.type === 'textarea' ? (
        <TextInputStep
          question={step.question}
          subtitle={step.subtitle}
          placeholder={step.placeholder}
          value={plan.answers.freeText}
          onChange={(value) =>
            updatePlan((current) => ({
              ...current,
              answers: {
                ...current.answers,
                freeText: value,
              },
            }))
          }
          onSkip={handleSkip}
          onSubmit={handleSubmit}
          locale={plan.locale}
        />
      ) : (
        <QuestionCard
          step={step}
          answers={plan.answers}
          onSingleSelect={handleSingleSelect}
          onMultiSelect={handleMultiSelect}
          onContinue={advanceStep}
          locale={plan.locale}
        />
      )}
    </StepWrapper>
  );
}
