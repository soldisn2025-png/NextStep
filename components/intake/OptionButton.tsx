'use client';

import { Check } from 'lucide-react';

interface OptionButtonProps {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export default function OptionButton({
  label,
  selected,
  disabled = false,
  onClick,
}: OptionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={label}
      className={`
        w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-body
        flex items-center justify-between gap-3
        transition-all duration-150
        ${selected
          ? 'border-primary bg-primary/10 text-primary font-medium'
          : 'border-gray-200 bg-white text-text-main hover:border-primary/40 hover:bg-primary/5'
        }
        ${disabled && !selected
          ? 'opacity-40 cursor-not-allowed hover:border-gray-200 hover:bg-white'
          : 'cursor-pointer'
        }
      `}
    >
      <span>{label}</span>
      {selected && (
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <Check size={12} className="text-white" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}
