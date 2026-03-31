import { parseStoredProgressEntry } from './actionPlanState';
import {
  ActionPlanProgressMap,
  IntakeAnswers,
  WeeklyCheckInEntry,
} from './types';

export const INTAKE_ANSWERS_STORAGE_KEY = 'nextstep_intake_answers';
export const INTAKE_STATE_STORAGE_KEY = 'nextstep_intake_state';
export const ZIP_STORAGE_KEY = 'nextstep_local_zip';
export const ACTION_PROGRESS_STORAGE_KEY = 'nextstep_action_progress';
export const WEEKLY_CHECK_IN_STORAGE_KEY = 'nextstep_weekly_checkin';
export const PLAN_UPDATED_AT_STORAGE_KEY = 'nextstep_plan_updated_at';

export const emptyAnswers: IntakeAnswers = {
  childAge: '',
  diagnosedBy: '',
  diagnoses: [],
  currentSupport: [],
  topConcerns: [],
  freeText: '',
};

export interface PersistedPlanSnapshot {
  answers: IntakeAnswers;
  currentStep: number;
  completed: boolean;
  savedZip: string;
  progress: ActionPlanProgressMap;
  weeklyCheckIn: WeeklyCheckInEntry | null;
  planUpdatedAt: string;
}

interface StoredIntakeState {
  currentStep?: unknown;
  completed?: unknown;
}

function parseIntakeAnswers(value: unknown): IntakeAnswers {
  if (!value || typeof value !== 'object') {
    return emptyAnswers;
  }

  const record = value as Record<string, unknown>;

  const parseStringArray = (field: string) =>
    Array.isArray(record[field])
      ? record[field].filter((item): item is string => typeof item === 'string')
      : [];

  return {
    childAge: typeof record.childAge === 'string' ? record.childAge : '',
    diagnosedBy: typeof record.diagnosedBy === 'string' ? record.diagnosedBy : '',
    diagnoses: parseStringArray('diagnoses'),
    currentSupport: parseStringArray('currentSupport'),
    topConcerns: parseStringArray('topConcerns'),
    freeText: typeof record.freeText === 'string' ? record.freeText : '',
  };
}

function parseIntakeState(value: unknown) {
  if (!value || typeof value !== 'object') {
    return { currentStep: 1, completed: false };
  }

  const record = value as StoredIntakeState;
  const currentStep =
    typeof record.currentStep === 'number' && Number.isFinite(record.currentStep)
      ? Math.max(1, Math.floor(record.currentStep))
      : 1;

  return {
    currentStep,
    completed: record.completed === true,
  };
}

export function parseWeeklyCheckIn(value: unknown): WeeklyCheckInEntry | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const checkedInAt =
    typeof record.checkedInAt === 'string' && record.checkedInAt.length > 0
      ? record.checkedInAt
      : null;

  if (!checkedInAt) {
    return null;
  }

  return {
    summary: typeof record.summary === 'string' ? record.summary : '',
    blocker: typeof record.blocker === 'string' ? record.blocker : '',
    focusActionId:
      typeof record.focusActionId === 'string'
        ? record.focusActionId
        : record.focusActionId === null
          ? null
          : null,
    checkedInAt,
  };
}

function parseProgressMap(value: unknown): ActionPlanProgressMap {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const parsed = value as Record<string, Record<string, unknown>>;

  return Object.fromEntries(
    Object.entries(parsed).flatMap(([actionId, entry]) => {
      const normalizedEntry = parseStoredProgressEntry(entry);

      if (normalizedEntry) {
        return [[actionId, normalizedEntry]];
      }

      return [];
    })
  );
}

export function getEmptyPlanSnapshot(): PersistedPlanSnapshot {
  return {
    answers: emptyAnswers,
    currentStep: 1,
    completed: false,
    savedZip: '',
    progress: {},
    weeklyCheckIn: null,
    planUpdatedAt: '',
  };
}

export function parsePersistedPlanSnapshot(value: unknown): PersistedPlanSnapshot {
  if (!value || typeof value !== 'object') {
    return getEmptyPlanSnapshot();
  }

  const record = value as Record<string, unknown>;
  const intakeState = parseIntakeState({
    currentStep: record.currentStep,
    completed: record.completed,
  });

  return {
    answers: parseIntakeAnswers(record.answers),
    currentStep: intakeState.currentStep,
    completed: intakeState.completed,
    savedZip: typeof record.savedZip === 'string' ? record.savedZip : '',
    progress: parseProgressMap(record.progress),
    weeklyCheckIn: parseWeeklyCheckIn(record.weeklyCheckIn),
    planUpdatedAt:
      typeof record.planUpdatedAt === 'string' ? record.planUpdatedAt : '',
  };
}

export function readLocalPlanSnapshot(): PersistedPlanSnapshot {
  if (typeof window === 'undefined') {
    return getEmptyPlanSnapshot();
  }

  try {
    const answers = parseIntakeAnswers(
      JSON.parse(localStorage.getItem(INTAKE_ANSWERS_STORAGE_KEY) ?? 'null')
    );
    const intakeState = parseIntakeState(
      JSON.parse(localStorage.getItem(INTAKE_STATE_STORAGE_KEY) ?? 'null')
    );
    const progress = parseProgressMap(
      JSON.parse(localStorage.getItem(ACTION_PROGRESS_STORAGE_KEY) ?? 'null')
    );
    const weeklyCheckIn = parseWeeklyCheckIn(
      JSON.parse(localStorage.getItem(WEEKLY_CHECK_IN_STORAGE_KEY) ?? 'null')
    );

    return {
      answers,
      currentStep: intakeState.currentStep,
      completed: intakeState.completed,
      savedZip: localStorage.getItem(ZIP_STORAGE_KEY) ?? '',
      progress,
      weeklyCheckIn,
      planUpdatedAt: localStorage.getItem(PLAN_UPDATED_AT_STORAGE_KEY) ?? '',
    };
  } catch {
    return getEmptyPlanSnapshot();
  }
}

export function writeLocalPlanSnapshot(snapshot: PersistedPlanSnapshot) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(INTAKE_ANSWERS_STORAGE_KEY, JSON.stringify(snapshot.answers));
    localStorage.setItem(
      INTAKE_STATE_STORAGE_KEY,
      JSON.stringify({
        currentStep: snapshot.currentStep,
        completed: snapshot.completed,
      })
    );
    localStorage.setItem(ZIP_STORAGE_KEY, snapshot.savedZip);
    localStorage.setItem(ACTION_PROGRESS_STORAGE_KEY, JSON.stringify(snapshot.progress));

    if (snapshot.weeklyCheckIn) {
      localStorage.setItem(
        WEEKLY_CHECK_IN_STORAGE_KEY,
        JSON.stringify(snapshot.weeklyCheckIn)
      );
    } else {
      localStorage.removeItem(WEEKLY_CHECK_IN_STORAGE_KEY);
    }

    if (snapshot.planUpdatedAt) {
      localStorage.setItem(PLAN_UPDATED_AT_STORAGE_KEY, snapshot.planUpdatedAt);
    } else {
      localStorage.removeItem(PLAN_UPDATED_AT_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function clearLocalPlanSnapshot() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(INTAKE_ANSWERS_STORAGE_KEY);
    localStorage.removeItem(INTAKE_STATE_STORAGE_KEY);
    localStorage.removeItem(ZIP_STORAGE_KEY);
    localStorage.removeItem(ACTION_PROGRESS_STORAGE_KEY);
    localStorage.removeItem(WEEKLY_CHECK_IN_STORAGE_KEY);
    localStorage.removeItem(PLAN_UPDATED_AT_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

export function isPlanSnapshotEmpty(snapshot: PersistedPlanSnapshot) {
  const hasAnswers = Object.values(snapshot.answers).some((value) =>
    Array.isArray(value) ? value.length > 0 : value.trim().length > 0
  );

  return (
    !hasAnswers &&
    snapshot.currentStep === 1 &&
    snapshot.completed === false &&
    snapshot.savedZip.length === 0 &&
    Object.keys(snapshot.progress).length === 0 &&
    snapshot.weeklyCheckIn === null
  );
}
