'use client';

interface TextInputStepProps {
  question: string;
  subtitle?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSkip: () => void;
  onSubmit: () => void;
}

export default function TextInputStep({
  question,
  subtitle,
  placeholder,
  value,
  onChange,
  onSkip,
  onSubmit,
}: TextInputStepProps) {
  return (
    <div>
      <h2 className="font-heading text-2xl text-text-main mb-1 leading-snug">{question}</h2>
      {subtitle && (
        <p className="text-sm text-gray-500 font-body mb-5">{subtitle}</p>
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
          aria-label="See my next steps"
          className="w-full py-3.5 px-6 rounded-xl bg-accent text-white font-body font-medium text-sm hover:bg-amber-500 transition-colors duration-150"
        >
          See my next steps →
        </button>
        <button
          onClick={onSkip}
          aria-label="Skip this step"
          className="w-full py-2 text-sm text-gray-500 font-body hover:text-primary transition-colors duration-150"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
