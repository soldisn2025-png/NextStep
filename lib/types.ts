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

export interface RecommendedAction {
  id: string;
  title: string;
  description: string;
  category: 'therapy' | 'school' | 'insurance' | 'community' | 'parent';
  urgency: 'immediate' | 'soon' | 'when-ready';
  learnMoreUrl?: string;
  resources?: { label: string; url: string }[];
}

export interface IntakeAnswers {
  childAge: string;
  diagnosedBy: string;
  diagnoses: string[];
  currentSupport: string[];
  topConcerns: string[];
  freeText: string;
}
