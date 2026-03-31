'use client';

import { useMemo, useState } from 'react';
import { Bot, Copy, Loader2, Sparkles } from 'lucide-react';
import { ACTION_ASSISTANT_OPTIONS } from '@/lib/actionAssistant';
import { ActionAssistantMode, ActionPlanProgressEntry } from '@/lib/types';

interface ActionAIAssistantProps {
  actionId: string;
  actionTitle: string;
  actionDescription: string;
  entry?: ActionPlanProgressEntry;
}

interface AssistantResponse {
  output: string;
}

export default function ActionAIAssistant({
  actionId,
  actionTitle,
  actionDescription,
  entry,
}: ActionAIAssistantProps) {
  const [selectedMode, setSelectedMode] = useState<ActionAssistantMode>('draft-email');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentOption = useMemo(
    () => ACTION_ASSISTANT_OPTIONS.find((option) => option.mode === selectedMode) ?? ACTION_ASSISTANT_OPTIONS[0],
    [selectedMode]
  );

  const canSummarizeNotes = Boolean(entry?.notes?.trim());

  const handleGenerate = async () => {
    if (selectedMode === 'summarize-notes' && !canSummarizeNotes) {
      setError('Add step notes first if you want an AI summary.');
      return;
    }

    setIsLoading(true);
    setError('');
    setCopied(false);

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
        setError(payload.error ?? 'The AI helper could not generate a result.');
        setOutput('');
        return;
      }

      setOutput(payload.output);
    } catch {
      setError('The AI helper could not generate a result.');
      setOutput('');
    } finally {
      setIsLoading(false);
    }
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
            AI helper
          </div>
          <h4 className="mt-3 font-heading text-xl text-text-main">Use AI to remove friction, not replace judgment.</h4>
          <p className="mt-2 max-w-2xl text-sm text-[#625e53] font-body leading-relaxed">
            Keep this narrow. Generate a draft, a call script, or a short question set tied to this exact action.
          </p>
        </div>
        <p className="max-w-xs text-xs text-[#8a8377] font-body leading-relaxed md:text-right">
          The draft uses this step title plus any notes and follow-up dates saved above.
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
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-[20px] border border-[#e7decd] bg-white/80 px-4 py-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
          Selected tool
        </p>
        <p className="mt-2 text-sm text-[#4f4b42] font-body leading-relaxed">
          {currentOption.description}
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#6d6b47] px-4 py-2.5 text-sm text-white font-body transition-colors hover:bg-[#5a583a] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {isLoading ? 'Generating' : `Generate ${currentOption.label.toLowerCase()}`}
          </button>
          {output && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#ddd3bf] bg-white px-4 py-2.5 text-sm text-[#5a5549] font-body transition-colors hover:border-[#7f7a57] hover:text-[#504b40]"
            >
              <Copy size={14} />
              {copied ? 'Copied' : 'Copy result'}
            </button>
          )}
        </div>

        {error && (
          <p className="mt-3 text-sm text-[#a25547] font-body">
            {error}
          </p>
        )}

        {output && (
          <div className="mt-4 rounded-[20px] border border-[#dfd6c4] bg-[#fffdf8] px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
              AI output
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
