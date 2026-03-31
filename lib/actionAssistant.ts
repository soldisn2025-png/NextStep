import { ActionAssistantMode } from './types';

export interface ActionAssistantOption {
  mode: ActionAssistantMode;
  label: string;
  description: string;
}

export const ACTION_ASSISTANT_OPTIONS: ActionAssistantOption[] = [
  {
    mode: 'draft-email',
    label: 'Draft email',
    description: 'Turn this step into a concise outreach email you can edit and send.',
  },
  {
    mode: 'call-script',
    label: 'Call script',
    description: 'Prepare a short phone script with the right questions and closing ask.',
  },
  {
    mode: 'meeting-questions',
    label: 'Meeting questions',
    description: 'Generate a focused question list for a school, provider, or insurer.',
  },
  {
    mode: 'summarize-notes',
    label: 'Summarize notes',
    description: 'Condense your notes into a short recap and the clearest next moves.',
  },
];

export function getActionAssistantOption(mode: ActionAssistantMode) {
  return ACTION_ASSISTANT_OPTIONS.find((option) => option.mode === mode) ?? ACTION_ASSISTANT_OPTIONS[0];
}
