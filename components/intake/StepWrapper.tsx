'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface StepWrapperProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  children: React.ReactNode;
}

export default function StepWrapper({
  currentStep,
  totalSteps,
  onBack,
  children,
}: StepWrapperProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Mobile-only branding bar */}
      <div className="flex items-center justify-between mb-4 lg:hidden">
        <Link
          href="/"
          aria-label="Go to NextStep home"
          className="font-heading text-lg text-text-main leading-none"
        >
          NextStep
        </Link>
        <span className="text-xs text-gray-400 font-body">
          Step {currentStep} of {totalSteps}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          {currentStep > 1 ? (
            <button
              onClick={onBack}
              aria-label="Go back to previous step"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors min-h-[44px] min-w-[44px] -ml-2 px-2 rounded-lg"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          ) : (
            <Link
              href="/"
              aria-label="Go back to home"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors min-h-[44px] min-w-[44px] -ml-2 px-2 rounded-lg"
            >
              <ArrowLeft size={16} />
              <span>Home</span>
            </Link>
          )}
          <span className="text-sm text-gray-500 font-body hidden lg:block">
            Step {currentStep} of {totalSteps}
          </span>
        </div>
        {/* Progress track */}
        <div
          className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-label={`Step ${currentStep} of ${totalSteps}`}
        >
          <div
            className="h-full bg-success rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div>{children}</div>
    </div>
  );
}
