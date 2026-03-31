import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { ActionAssistantMode } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MODEL = 'gpt-5-mini';
const VALID_MODES: ActionAssistantMode[] = [
  'draft-email',
  'call-script',
  'meeting-questions',
  'summarize-notes',
];

interface ActionAssistantRequestBody {
  actionId?: string;
  actionTitle?: string;
  actionDescription?: string;
  mode?: ActionAssistantMode;
  notes?: string;
  lastContactDate?: string;
  nextFollowUpDate?: string;
}

function isMode(value: unknown): value is ActionAssistantMode {
  return typeof value === 'string' && VALID_MODES.includes(value as ActionAssistantMode);
}

function trimInput(value: unknown, maxLength = 3000) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function getModePrompt(mode: ActionAssistantMode) {
  switch (mode) {
    case 'draft-email':
      return 'Write one concise outreach email. Use a clear subject line, a direct ask, and no more than 170 words. Do not use placeholders unless necessary.';
    case 'call-script':
      return 'Write a short phone script with: opening line, 3 focused questions, and a closing ask. Keep it easy to read aloud.';
    case 'meeting-questions':
      return 'Write 5 concrete questions for the next school, provider, or insurance conversation. Questions should be specific and decision-oriented.';
    case 'summarize-notes':
      return 'Summarize the notes into 3 parts: what happened, what is still unclear, and the 3 best next actions. Keep it practical.';
    default:
      return 'Provide a concise, practical draft that helps move this task forward.';
  }
}

function buildPrompt(body: Required<Pick<ActionAssistantRequestBody, 'actionTitle' | 'actionDescription' | 'mode'>> & {
  notes: string;
  lastContactDate: string;
  nextFollowUpDate: string;
}) {
  return [
    `Action title: ${body.actionTitle}`,
    `Action description: ${body.actionDescription}`,
    body.lastContactDate ? `Last contact date: ${body.lastContactDate}` : 'Last contact date: not provided',
    body.nextFollowUpDate ? `Next follow-up date: ${body.nextFollowUpDate}` : 'Next follow-up date: not provided',
    body.notes ? `Notes: ${body.notes}` : 'Notes: none yet',
    '',
    getModePrompt(body.mode),
  ].join('\n');
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'The AI helper is not configured in this deployment.', code: 'missing_api_key' },
      { status: 503 }
    );
  }

  let body: ActionAssistantRequestBody;
  try {
    body = (await request.json()) as ActionAssistantRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const actionTitle = trimInput(body.actionTitle, 180);
  const actionDescription = trimInput(body.actionDescription, 900);
  const notes = trimInput(body.notes, 3000);
  const lastContactDate = trimInput(body.lastContactDate, 20);
  const nextFollowUpDate = trimInput(body.nextFollowUpDate, 20);

  if (!isMode(body.mode)) {
    return NextResponse.json({ error: 'A valid AI helper mode is required.' }, { status: 400 });
  }

  if (!actionTitle || !actionDescription) {
    return NextResponse.json(
      { error: 'Action title and description are required.' },
      { status: 400 }
    );
  }

  if (body.mode === 'summarize-notes' && !notes) {
    return NextResponse.json(
      { error: 'Add notes before asking for a summary.' },
      { status: 400 }
    );
  }

  try {
    const client = new OpenAI({ apiKey });
    const response = await client.responses.create({
      model: MODEL,
      instructions:
        'You help caregivers move autism-related support tasks forward. Be concrete, calm, and objective. Focus on logistics, communication, questions, and next actions. Do not give medical, therapeutic, or legal advice. Do not add encouragement, hedging, or generic filler. Output only the requested artifact.',
      input: buildPrompt({
        actionTitle,
        actionDescription,
        mode: body.mode,
        notes,
        lastContactDate,
        nextFollowUpDate,
      }),
      max_output_tokens: 420,
    });

    const output = response.output_text.trim();
    if (!output) {
      return NextResponse.json(
        { error: 'The AI helper returned an empty result.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ output }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'The AI helper is temporarily unavailable.';

    return NextResponse.json(
      { error: message, code: 'assistant_failed' },
      { status: 500 }
    );
  }
}
