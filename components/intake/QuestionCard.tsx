'use client';

import OptionButton from './OptionButton';
import { IntakeStep, IntakeAnswers } from '@/lib/types';

interface QuestionCardProps {
  step: IntakeStep;
  answers: IntakeAnswers;
  onSingleSelect: (fieldName: string, value: string) => void;
  onMultiSelect: (fieldName: string, value: string) => void;
  onContinue: () => void;
}

export default function QuestionCard({
  step,
  answers,
  onSingleSelect,
  onMultiSelect,
  onContinue,
}: QuestionCardProps) {
  const { fieldName, question, subtitle, type, options, maxSelections } = step;

  const getSelectedValues = (): string[] => {
    const val = answers[fieldName as keyof IntakeAnswers];
    if (Array.isArray(val)) return val;
    return [];
  };

  const selectedValues = getSelectedValues();
  const hasSelection = selectedValues.length > 0;
  const atMax = maxSelections !== undefined && selectedValues.length >= maxSelections;

  return (
    <div className={type === 'multi-select' ? 'pb-24 lg:pb-0' : ''}>
      {/* Question heading */}
      <h2 className="font-heading text-2xl text-text-main mb-1 leading-snug">{question}</h2>
      {subtitle && (
        <p className="text-sm text-gray-500 font-body mb-5">{subtitle}</p>
      )}
      {!subtitle && <div className="mb-5" />}

      {/* Single-select hint — shown until user taps */}
      {type === 'single-select' && !answers[fieldName as keyof IntakeAnswers] && (
        <p className="text-xs text-gray-400 font-body mb-4">Tap an option to continue &rarr;</p>
      )}

      {/* Options */}
      <div className="flex flex-col gap-2.5">
        {options?.map((option) => {
          const isSelected =
            type === 'single-select'
              ? answers[fieldName as keyof IntakeAnswers] === option
              : selectedValues.includes(option);

          const isDisabled = type === 'multi-select' && atMax && !isSelected;

          return (
            <OptionButton
              key={option}
              label={option}
              selected={isSelected}
              disabled={isDisabled}
              onClick={() => {
                if (type === 'single-select') {
                  onSingleSelect(fieldName, option);
                } else {
                  onMultiSelect(fieldName, option);
                }
              }}
            />
          );
        })}
      </div>

      {/* Continue button for multi-select — sticky on mobile, inline on desktop */}
      {type === 'multi-select' && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-white/95 backdrop-blur border-t border-gray-100 lg:static lg:px-0 lg:pb-0 lg:pt-0 lg:mt-6 lg:bg-transparent lg:backdrop-blur-none lg:border-0">
          <button
            onClick={onContinue}
            disabled={!hasSelection}
            aria-label="Continue to next step"
            className={`
              w-full py-3.5 px-6 rounded-xl font-body font-medium text-sm
              transition-all duration-150
              ${hasSelection
                ? 'bg-accent text-white hover:bg-amber-500 cursor-pointer'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
