import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { DocumentAnalysisType } from '@/lib/types';
import { aiRateLimit } from '@/lib/rateLimit';
import { getSupabaseServerClient } from '@/lib/supabase/server';


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MODEL = 'claude-sonnet-4-6';
const VALID_TYPES: DocumentAnalysisType[] = [
  'iep-notes',
  'evaluation-report',
  'insurance-denial',
  'school-email',
  'provider-intake',
];

interface DocumentAssistantRequestBody {
  type?: DocumentAnalysisType;
  title?: string;
  sourceText?: string;
}

function isDocumentAnalysisType(value: unknown): value is DocumentAnalysisType {
  return typeof value === 'string' && VALID_TYPES.includes(value as DocumentAnalysisType);
}

function trimInput(value: unknown, maxLength = 6000) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function getDocumentPrompt(type: DocumentAnalysisType) {
  switch (type) {
    case 'iep-notes':
      return 'Extract school-related next steps, deadlines, requested documents, and questions for the next IEP or eligibility conversation.';
    case 'evaluation-report':
      return 'Summarize the findings in plain language and extract the 3 best practical follow-up actions for therapy, school, or medical coordination.';
    case 'insurance-denial':
      return 'Identify the denial reason, time-sensitive appeal steps, missing information, and the best next actions to challenge or work around the denial.';
    case 'school-email':
      return 'Extract what the school is asking for, what has not been answered yet, and the next response or meeting actions needed.';
    case 'provider-intake':
      return 'Extract intake requirements, documents needed, timeline details, and the next steps to complete enrollment or get on the waitlist.';
    default:
      return 'Extract the most practical next actions from this document.';
  }
}

export async function POST(request: NextRequest) {
    const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Authentication not configured.' }, { status: 503 });
  }
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Sign in to use this feature.' }, { status: 401 });
  }

  const { success } = await aiRateLimit.limit(user.id);
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment before trying again.' },
      { status: 429 }
    );
  }
const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'The document analyzer is not configured in this deployment.', code: 'missing_api_key' },
      { status: 503 }
    );
  }

  let body: DocumentAssistantRequestBody;
  try {
    body = (await request.json()) as DocumentAssistantRequestBody;
  } catch {
    return NextResponse.json(
      { error: 'The AI helper is temporarily unavailable.', code: 'assistant_failed' },
      { status: 500 }
    );
  }

  if (!isDocumentAnalysisType(body.type)) {
    return NextResponse.json({ error: 'A valid document type is required.' }, { status: 400 });
  }

  const title = trimInput(body.title, 160);
  const sourceText = trimInput(body.sourceText, 8000);

  if (!sourceText) {
    return NextResponse.json({ error: 'Paste document text to analyze.' }, { status: 400 });
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: MODEL,
      system:
        'You help caregivers turn autism-related documents into practical next actions. Be concrete, objective, and concise. Do not provide legal, medical, or therapeutic advice. Output plain text only with exactly these section headers: Situation summary, Time-sensitive points, What is still unclear, Next 3 actions, Questions to ask.',
      messages: [
        {
          role: 'user',
          content: [
            `Document type: ${body.type}`,
            title ? `Title: ${title}` : 'Title: not provided',
            '',
            getDocumentPrompt(body.type),
            '',
            'Document text:',
            sourceText,
          ].join('\n'),
        },
      ],
      max_tokens: 650,
    });

    const output = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n\n')
      .trim();
    if (!output) {
      return NextResponse.json(
        { error: 'The document analyzer returned an empty result.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ output }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'The document analyzer is temporarily unavailable.';

    return NextResponse.json(
      { error: message, code: 'document_analysis_failed' },
      { status: 500 }
    );
  }
}
