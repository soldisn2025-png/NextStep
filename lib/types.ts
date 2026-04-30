export type StepType = 'single-select' | 'multi-select' | 'textarea';
export type AppLocale = 'en-US' | 'ko-KR';

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
  category:
    | 'therapy'
    | 'school'
    | 'insurance'
    | 'community'
    | 'parent'
    | 'doctor'
    | 'government'
    | 'daily'
    | 'resources';
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

export type ActionPlanStatus = 'not-started' | 'in-progress' | 'done' | 'skipped';
export type ReminderLeadDays = 0 | 1 | 3 | 7 | null;
export type ExecutionLogType =
  | 'email-sent'
  | 'call-made'
  | 'voicemail-left'
  | 'meeting-booked'
  | 'form-submitted';

export interface ActionExecutionDraft {
  id: string;
  mode: ActionAssistantMode;
  content: string;
  savedAt: string;
  updatedAt: string;
}

export interface ActionExecutionLogEntry {
  id: string;
  type: ExecutionLogType;
  note: string;
  createdAt: string;
}

export interface ActionPlanProgressEntry {
  status: ActionPlanStatus;
  updatedAt: string;
  notes?: string;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  reminderLeadDays?: ReminderLeadDays;
  savedDrafts?: ActionExecutionDraft[];
  executionLog?: ActionExecutionLogEntry[];
}

export type ActionPlanProgressMap = Record<string, ActionPlanProgressEntry>;

export interface WeeklyCheckInEntry {
  summary: string;
  blocker: string;
  focusActionId: string | null;
  checkedInAt: string;
}

export type DocumentAnalysisType =
  | 'iep-notes'
  | 'evaluation-report'
  | 'insurance-denial'
  | 'school-email'
  | 'provider-intake';

export interface DocumentAnalysisEntry {
  id: string;
  type: DocumentAnalysisType;
  title: string;
  sourceText: string;
  output: string;
  analyzedAt: string;
}

export type PlanSyncStatus =
  | 'signed-out'
  | 'not-configured'
  | 'syncing'
  | 'synced'
  | 'error';

export type ActionAssistantMode =
  | 'draft-email'
  | 'call-script'
  | 'meeting-questions'
  | 'summarize-notes';
