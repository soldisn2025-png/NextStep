import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MODEL = 'claude-sonnet-4-6';

const SPECIALIST_MAP: Record<string, string> = {
  'explore-aba-under6': 'a BCBA running early intensive ABA programs for young children',
  'explore-aba-6-12': 'a BCBA who accepts school-age children and works with insurance',
  'explore-aba-teen': 'a BCBA who specializes in adolescents and transition-age youth',
  'find-slp': 'a Speech-Language Pathologist experienced with autism',
  'find-ot': 'an Occupational Therapist experienced with sensory processing and autism',
};

interface TherapistGuideRequestBody {
  actionId?: string;
  childAge?: string;
  diagnoses?: string[];
  topConcerns?: string[];
}

function trimInput(value: unknown, maxLength = 200): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function buildPrompt(
  actionId: string,
  childAge: string,
  diagnoses: string[],
  topConcerns: string[],
): string {
  const specialist = SPECIALIST_MAP[actionId] ?? 'a specialist for this area';
  return [
    `Child age: ${childAge || 'not specified'}`,
    `Diagnoses: ${diagnoses.length > 0 ? diagnoses.join(', ') : 'not specified'}`,
    `Parent concerns: ${topConcerns.length > 0 ? topConcerns.join(', ') : 'not specified'}`,
    `Specialist type: ${specialist}`,
    '',
    `Write a short guide for this parent on what to look for when choosing ${specialist}.`,
    'Include:',
    "1. One sentence on what type of specialist to prioritize and why, based on this child's age and diagnoses",
    '2. Exactly 3 specific questions to ask before starting — concrete and decision-oriented',
    '3. One clear red flag to watch out for',
    '',
    'Rules: 150 words maximum. No jargon — write for a stressed parent, not a clinician. No filler phrases.',
  ].join('\n');
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'The AI guide is not configured in this deployment.', code: 'missing_api_key' },
      { status: 503 }
    );
  }

  let body: TherapistGuideRequestBody;
  try {
    body = (await request.json()) as TherapistGuideRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const actionId = trimInput(body.actionId, 50);
  const childAge = trimInput(body.childAge, 30);
  const diagnoses = Array.isArray(body.diagnoses)
    ? body.diagnoses.map((d) => trimInput(d, 80)).filter(Boolean).slice(0, 10)
    : [];
  const topConcerns = Array.isArray(body.topConcerns)
    ? body.topConcerns.map((c) => trimInput(c, 80)).filter(Boolean).slice(0, 10)
    : [];

  if (!actionId) {
    return NextResponse.json({ error: 'actionId is required.' }, { status: 400 });
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: MODEL,
      system:
        'You help parents of newly diagnosed autistic children find and evaluate therapists. Be specific, calm, and practical. No medical advice. No encouragement phrases. No filler. Write only what was asked. Do not use markdown symbols like ** or *. For emphasis, use plain text only.',
      messages: [{ role: 'user', content: buildPrompt(actionId, childAge, diagnoses, topConcerns) }],
      max_tokens: 300,
    });

    const output = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n\n')
      .trim();

    if (!output) {
      return NextResponse.json({ error: 'The guide returned an empty result.' }, { status: 502 });
    }

    return NextResponse.json({ guide: output }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The guide is temporarily unavailable.';
    return NextResponse.json({ error: message, code: 'guide_failed' }, { status: 500 });
  }
}
