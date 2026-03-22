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
    <div>
      {/* Question heading */}
      <h2 className="font-heading text-2xl text-text-main mb-1 leading-snug">{question}</h2>
      {subtitle && (
        <p className="text-sm text-gray-500 font-body mb-5">{subtitle}</p>
      )}
      {!subtitle && <div className="mb-5" />}

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

      {/* Continue button for multi-select */}
      {type === 'multi-select' && (
        <button
          onClick={onContinue}
          disabled={!hasSelection}
          aria-label="Continue to next step"
          className={`
            mt-6 w-full py-3.5 px-6 rounded-xl font-body font-medium text-sm
            transition-all duration-150
            ${hasSelection
              ? 'bg-accent text-white hover:bg-amber-500 cursor-pointer'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          Continue
        </button>
      )}
    </div>
  );
}
