export type StepType = 'single-select' | 'multi-select' | 'textarea';

export interface IntakeStep {
  id: number;
  fieldName: string;
  question: string;
  subtitle?: string;
  type: StepType;
  options?: string[];
  maxSelections?: number;
  optional?: boolean;
  placeholder?: string;
}

export interface ResourceLink {
  label: string;
  url: string;
}

export interface SupportItem extends ResourceLink {
  affiliate?: boolean;
}

export interface RecommendedAction {
  id: string;
  title: string;
  description: string;
  category: 'therapy' | 'school' | 'insurance' | 'community' | 'parent';
  urgency: 'immediate' | 'soon' | 'when-ready';
  learnMoreUrl?: string;
  resources?: ResourceLink[];
  supportItems?: SupportItem[];
}

export interface IntakeAnswers {
  childAge: string;
  diagnosedBy: string;
  diagnoses: string[];
  currentSupport: string[];
  topConcerns: string[];
  freeText: string;
}

export interface LocalResource extends ResourceLink {
  id: string;
  description: string;
  kind: 'official-program' | 'parent-group' | 'provider';
  regionIds: string[];
  actionIds: string[];
  verifiedAt: string;
}

export interface LocationMatch {
  zip: string;
  regionIds: string[];
  primaryRegionLabel: string | null;
}

export type ProviderSearchKind = 'speech' | 'ot' | 'aba';

export interface ProviderSearchResult {
  id: string;
  kind: ProviderSearchKind;
  name: string;
  address: string;
  phone: string | null;
  websiteUri: string | null;
  googleMapsUri: string;
  rating: number | null;
  userRatingCount: number;
  distanceMiles: number | null;
  reviewConfidence: 'strong' | 'limited' | 'none';
  primaryType: string | null;
  score: number;
  attributions: ResourceLink[];
}

export interface ProviderSearchPayload {
  kind: ProviderSearchKind;
  providers: ProviderSearchResult[];
  sourceLabel: string;
  rankingSummary: string;
  generatedAt: string;
}
