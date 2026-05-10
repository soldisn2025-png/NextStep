'use client';

import type { AppLocale } from '@/lib/types';

interface TextInputStepProps {
  question: string;
  subtitle?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSkip: () => void;
  onSubmit: () => void;
  locale?: AppLocale;
}

export default function TextInputStep({
  question,
  subtitle,
  placeholder,
  value,
  onChange,
  onSkip,
  onSubmit,
  locale = 'en-US',
}: TextInputStepProps) {
  const valuePitch = locale === 'ko-KR'
    ? '여기에 적어주시면 더 정확한 첫 단계를 안내해 드릴 수 있어요. 짧게 한 줄도 충분합니다.'
    : 'The more context you share, the more specific your next steps will be. Even one sentence helps.';

  const submitLabel = locale === 'ko-KR' ? '완료 — 내 첫 단계 보기 →' : 'Done — See my next steps →';
  const skipLabel = locale === 'ko-KR' ? '건너뛰고 바로 보기' : 'Skip and see results';

  return (
    <div>
      {/* Value-first context box */}
      <div className="flex gap-3 items-start bg-primary/8 border border-primary/20 rounded-xl px-4 py-3 mb-5">
        <span className="text-lg leading-none mt-0.5">💡</span>
        <p className="text-sm text-primary font-body font-medium leading-relaxed">{valuePitch}</p>
      </div>

      <h2 className="font-heading text-2xl font-bold text-text-main mb-1 leading-snug">{question}</h2>
      {subtitle && (
        <p className="text-sm text-gray-500 font-body mb-4">{subtitle}</p>
      )}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={question}
        rows={5}
        className="
          w-full rounded-xl border-2 border-gray-200 px-4 py-3
          text-sm font-body text-text-main
          focus:outline-none focus:border-primary
          placeholder:text-gray-400
          resize-none transition-colors duration-150
        "
      />

      <div className="mt-4 flex flex-col gap-3">
        <button
          onClick={onSubmit}
          aria-label={submitLabel}
          className="w-full py-3.5 px-6 rounded-xl bg-accent text-white font-body font-semibold text-sm hover:bg-amber-500 transition-colors duration-150"
        >
          {submitLabel}
        </button>
        <button
          onClick={onSkip}
          aria-label={skipLabel}
          className="w-full py-2 text-sm text-gray-400 font-body hover:text-gray-600 transition-colors duration-150"
        >
          {skipLabel}
        </button>
      </div>
    </div>
  );
}
