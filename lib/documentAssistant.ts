import { DocumentAnalysisType } from './types';

export const DOCUMENT_ANALYSIS_OPTIONS: Array<{
  type: DocumentAnalysisType;
  label: string;
  description: string;
}> = [
  {
    type: 'iep-notes',
    label: 'IEP notes',
    description: 'Meeting notes, proposed goals, or special education updates.',
  },
  {
    type: 'evaluation-report',
    label: 'Evaluation report',
    description: 'Testing summaries, assessment findings, or diagnostic write-ups.',
  },
  {
    type: 'insurance-denial',
    label: 'Insurance denial',
    description: 'Coverage denial letters, authorization issues, or appeal responses.',
  },
  {
    type: 'school-email',
    label: 'School email',
    description: 'Teacher, counselor, or district email threads that need a next move.',
  },
  {
    type: 'provider-intake',
    label: 'Provider intake',
    description: 'Clinic instructions, waitlist messages, or intake requirements.',
  },
];

export function getDocumentAnalysisLabel(type: DocumentAnalysisType) {
  return (
    DOCUMENT_ANALYSIS_OPTIONS.find((option) => option.type === type)?.label ??
    'Document'
  );
}
