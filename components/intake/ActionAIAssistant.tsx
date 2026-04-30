'use client';

import { useMemo, useState } from 'react';
import { Bot, Copy, Loader2, Save, Sparkles } from 'lucide-react';
import { ACTION_ASSISTANT_OPTIONS } from '@/lib/actionAssistant';
import { createDraftId, upsertExecutionDraft } from '@/lib/executionTools';
import { ActionAssistantMode, ActionPlanProgressEntry, AppLocale } from '@/lib/types';

interface ActionAIAssistantProps {
  actionId: string;
  actionTitle: string;
  actionDescription: string;
  locale?: AppLocale;
  entry?: ActionPlanProgressEntry;
  onUpdate: (updates: Partial<ActionPlanProgressEntry>) => void;
}

interface AssistantResponse {
  output: string;
}

const KR_OPTION_LABELS: Record<ActionAssistantMode, string> = {
  'draft-email': '이메일 초안',
  'call-script': '전화 스크립트',
  'meeting-questions': '미팅 질문',
  'summarize-notes': '메모 요약',
};

const KR_OPTION_DESCRIPTIONS: Record<ActionAssistantMode, string> = {
  'draft-email': '이 단계를 바탕으로 수정·발송 가능한 이메일 초안을 만듭니다.',
  'call-script': '통화에 필요한 질문과 마무리 요청이 포함된 짧은 전화 스크립트를 준비합니다.',
  'meeting-questions': '학교, 치료사, 보험사와의 미팅에 맞는 질문 목록을 만듭니다.',
  'summarize-notes': '메모를 짧은 요약과 다음 행동으로 정리합니다.',
};

export default function ActionAIAssistant({
  actionId,
  actionTitle,
  actionDescription,
  locale,
  entry,
  onUpdate,
}: ActionAIAssistantProps) {
  const [selectedMode, setSelectedMode] = useState<ActionAssistantMode>('draft-email');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const isKorean = locale === 'ko-KR';

  const currentOption = useMemo(
    () => ACTION_ASSISTANT_OPTIONS.find((option) => option.mode === selectedMode) ?? ACTION_ASSISTANT_OPTIONS[0],
    [selectedMode]
  );

  const canSummarizeNotes = Boolean(entry?.notes?.trim());

  const handleGenerate = async () => {
    if (selectedMode === 'summarize-notes' && !canSummarizeNotes) {
      setError(isKorean ? 'AI 요약을 사용하려면 먼저 메모를 입력하세요.' : 'Add step notes first if you want an AI summary.');
      return;
    }

    setIsLoading(true);
    setError('');
    setCopied(false);
    setSaved(false);

    try {
      const response = await fetch('/api/action-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actionId,
          actionTitle,
          actionDescription,
          mode: selectedMode,
          notes: entry?.notes ?? '',
          lastContactDate: entry?.lastContactDate ?? '',
          nextFollowUpDate: entry?.nextFollowUpDate ?? '',
        }),
      });

      const payload = (await response.json()) as AssistantResponse & { error?: string };

      if (!response.ok) {
        setError(payload.error ?? (isKorean ? 'AI 도우미가 결과를 생성하지 못했습니다.' : 'The AI helper could not generate a result.'));
        setOutput('');
        return;
      }

      setOutput(payload.output);
    } catch {
      setError(isKorean ? 'AI 도우미가 결과를 생성하지 못했습니다.' : 'The AI helper could not generate a result.');
      setOutput('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = () => {
    const trimmedOutput = output.trim();
    if (!trimmedOutput) {
      return;
    }

    const now = new Date().toISOString();
    const currentDrafts = entry?.savedDrafts ?? [];
    const existingDraft = currentDrafts.find((draft) => draft.mode === selectedMode);
    const nextDraft = existingDraft
      ? {
          ...existingDraft,
          content: trimmedOutput,
          updatedAt: now,
        }
      : {
          id: createDraftId(selectedMode),
          mode: selectedMode,
          content: trimmedOutput,
          savedAt: now,
          updatedAt: now,
        };

    onUpdate({
      savedDrafts: upsertExecutionDraft(currentDrafts, nextDraft),
      status: entry?.status === 'done' ? 'done' : 'in-progress',
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const handleCopy = async () => {
    if (!output) {
      return;
    }

    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mt-5 rounded-[24px] border border-[#ddd7ca] bg-[linear-gradient(180deg,rgba(252,249,242,0.95),rgba(246,242,233,0.98))] px-4 py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ddd3bf] bg-white/85 px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#6d6658] font-body">
            <Bot size={13} className="text-[#7a724b]" />
            {isKorean ? 'AI 도우미' : 'AI helper'}
          </div>
          <h4 className="mt-3 font-heading text-xl text-text-main">
            {isKorean ? '판단을 대신하는 게 아니라 작업 부담을 줄여드립니다.' : 'Use AI to remove friction, not replace judgment.'}
          </h4>
          <p className="mt-2 max-w-2xl text-sm text-[#625e53] font-body leading-relaxed">
            {isKorean
              ? '이 단계에 맞는 이메일 초안, 전화 스크립트, 질문 목록을 만드세요.'
              : 'Keep this narrow. Generate a draft, a call script, or a short question set tied to this exact action.'}
          </p>
        </div>
        <p className="max-w-xs text-xs text-[#8a8377] font-body leading-relaxed md:text-right">
          {isKorean
            ? '위에 저장된 메모와 날짜를 바탕으로 초안을 만듭니다.'
            : 'The draft uses this step title plus any notes and follow-up dates saved above.'}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {ACTION_ASSISTANT_OPTIONS.map((option) => (
          <button
            key={option.mode}
            type="button"
            onClick={() => {
              setSelectedMode(option.mode);
              setError('');
            }}
            className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-body transition-colors ${
              selectedMode === option.mode
                ? 'border-[#d7d0b9] bg-[#efe9d7] text-[#5b583d]'
                : 'border-[#ddd3bf] bg-white text-[#5a5549] hover:border-[#7f7a57] hover:text-[#504b40]'
            }`}
          >
            {isKorean ? KR_OPTION_LABELS[option.mode] : option.label}
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-[20px] border border-[#e7decd] bg-white/80 px-4 py-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
          {isKorean ? '선택된 도구' : 'Selected tool'}
        </p>
        <p className="mt-2 text-sm text-[#4f4b42] font-body leading-relaxed">
          {isKorean ? KR_OPTION_DESCRIPTIONS[currentOption.mode] : currentOption.description}
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#6d6b47] px-4 py-2.5 text-sm text-white font-body transition-colors hover:bg-[#5a583a] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {isLoading
                ? (isKorean ? '생성 중' : 'Generating')
                : isKorean
                  ? '생성하기'
                  : `Generate ${currentOption.label.toLowerCase()}`}
            </button>
            {output && (
              <>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d5cfaf] bg-[#f8f3e6] px-4 py-2.5 text-sm text-[#5a5549] font-body transition-colors hover:border-[#7f7a57] hover:text-[#504b40]"
                >
                  <Save size={14} />
                  {saved
                    ? (isKorean ? '저장됨' : 'Saved to step')
                    : (isKorean ? '단계에 저장' : 'Save to step')}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#ddd3bf] bg-white px-4 py-2.5 text-sm text-[#5a5549] font-body transition-colors hover:border-[#7f7a57] hover:text-[#504b40]"
                >
                  <Copy size={14} />
                  {copied
                    ? (isKorean ? '복사됨' : 'Copied')
                    : (isKorean ? '결과 복사' : 'Copy result')}
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-[#a25547] font-body">
            {error}
          </p>
        )}

        {output && (
          <div className="mt-4 rounded-[20px] border border-[#dfd6c4] bg-[#fffdf8] px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
              {isKorean ? 'AI 결과' : 'AI output'}
            </p>
            <pre className="mt-3 whitespace-pre-wrap text-sm text-[#4f4b42] font-body leading-relaxed">
              {output}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
