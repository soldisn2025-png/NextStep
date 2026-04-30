import type { AppLocale } from './types';

export const DEFAULT_LOCALE: AppLocale = 'en-US';
export const LOCALE_STORAGE_KEY = 'nextstep_locale';

export const LOCALE_LABELS: Record<AppLocale, { title: string; subtitle: string }> = {
  'en-US': {
    title: 'English / United States',
    subtitle: 'U.S. school, insurance, therapy, and parent support steps',
  },
  'ko-KR': {
    title: '한국어 / 대한민국',
    subtitle: '한국의 교육, 의료, 복지, 치료 정보를 기준으로 안내합니다',
  },
};

export function isAppLocale(value: unknown): value is AppLocale {
  return value === 'en-US' || value === 'ko-KR';
}

export function readStoredLocale(): AppLocale {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return isAppLocale(stored) ? stored : DEFAULT_LOCALE;
}

export function writeStoredLocale(locale: AppLocale) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}
