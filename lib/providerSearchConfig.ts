import { AppLocale, ProviderSearchKind } from './types';

interface ProviderSearchConfig {
  kind: ProviderSearchKind;
  heading: string;
  searchLabel: string;
  textQuery: string;
  fallbackQuery: string;
  fitKeywords: string[];
}

const PROVIDER_SEARCH_CONFIG: Record<ProviderSearchKind, ProviderSearchConfig> = {
  speech: {
    kind: 'speech',
    heading: 'Nearby speech providers',
    searchLabel: 'speech therapy',
    textQuery: 'pediatric speech therapy',
    fallbackQuery: 'pediatric speech therapy',
    fitKeywords: ['speech', 'language', 'slp', 'communication', 'pediatric', 'child'],
  },
  ot: {
    kind: 'ot',
    heading: 'Nearby OT providers',
    searchLabel: 'occupational therapy',
    textQuery: 'pediatric occupational therapy',
    fallbackQuery: 'pediatric occupational therapy',
    fitKeywords: ['occupational', 'therapy', 'ot', 'sensory', 'pediatric', 'child'],
  },
  aba: {
    kind: 'aba',
    heading: 'Nearby ABA providers',
    searchLabel: 'ABA therapy',
    textQuery: 'ABA therapy for autism',
    fallbackQuery: 'ABA therapy for autism',
    fitKeywords: ['aba', 'behavior', 'autism', 'bcba', 'pediatric', 'child'],
  },
  doctor: {
    kind: 'doctor',
    heading: 'Nearby developmental medical options',
    searchLabel: 'developmental pediatric or child psychiatry care',
    textQuery: 'developmental pediatrician child psychiatrist autism',
    fallbackQuery: 'developmental pediatrician child psychiatrist autism',
    fitKeywords: ['developmental', 'pediatric', 'psychiatry', 'autism', 'child'],
  },
};

const ACTION_PROVIDER_KIND: Record<string, ProviderSearchKind> = {
  'find-slp': 'speech',
  'find-ot': 'ot',
  'explore-aba': 'aba',
  'explore-aba-under6': 'aba',
  'explore-aba-6-12': 'aba',
  'explore-aba-teen': 'aba',
  'find-slp-kr': 'speech',
  'find-ot-kr': 'ot',
  'behavior-therapy-kr': 'aba',
  'find-developmental-ped-kr': 'doctor',
};

export function getProviderSearchKindForAction(actionId: string): ProviderSearchKind | null {
  return ACTION_PROVIDER_KIND[actionId] ?? null;
}

export function getProviderSearchConfig(kind: ProviderSearchKind): ProviderSearchConfig {
  return PROVIDER_SEARCH_CONFIG[kind];
}

export function buildFallbackProviderSearchUrl(
  kind: ProviderSearchKind,
  zip: string,
  locale: AppLocale = 'en-US'
): string {
  if (locale === 'ko-KR') {
    const koreanQuery: Record<ProviderSearchKind, string> = {
      speech: '자폐 언어치료',
      ot: '아동 작업치료',
      aba: '자폐 행동치료 ABA 발달클리닉',
      doctor: '소아발달클리닉 소아정신과 재활의학과',
    };
    const encoded = encodeURIComponent(`${koreanQuery[kind]} ${zip}`.trim());
    return `https://map.naver.com/p/search/${encoded}`;
  }

  const query = `${PROVIDER_SEARCH_CONFIG[kind].fallbackQuery} near ${zip}`;
  const encoded = encodeURIComponent(query);
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}
