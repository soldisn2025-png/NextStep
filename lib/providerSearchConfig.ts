import { ProviderSearchKind } from './types';

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
};

const ACTION_PROVIDER_KIND: Record<string, ProviderSearchKind> = {
  'find-slp': 'speech',
  'find-ot': 'ot',
  'explore-aba': 'aba',
  'explore-aba-under6': 'aba',
  'explore-aba-6-12': 'aba',
  'explore-aba-teen': 'aba',
};

export function getProviderSearchKindForAction(actionId: string): ProviderSearchKind | null {
  return ACTION_PROVIDER_KIND[actionId] ?? null;
}

export function getProviderSearchConfig(kind: ProviderSearchKind): ProviderSearchConfig {
  return PROVIDER_SEARCH_CONFIG[kind];
}

export function buildFallbackProviderSearchUrl(kind: ProviderSearchKind, zip: string): string {
  const query = `${PROVIDER_SEARCH_CONFIG[kind].fallbackQuery} near ${zip}`;
  const encoded = encodeURIComponent(query);
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}
