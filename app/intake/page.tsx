'use client';

import { useState, useEffect } from 'react';
import StepWrapper from '@/components/intake/StepWrapper';
import QuestionCard from '@/components/intake/QuestionCard';
import TextInputStep from '@/components/intake/TextInputStep';
import ResultsCard from '@/components/intake/ResultsCard';
import { intakeSteps } from '@/lib/intakeSteps';
import { IntakeAnswers, RecommendedAction } from '@/lib/types';
import { getRecommendations } from '@/lib/rulesEngine';

const STORAGE_KEY = 'nextstep_intake_answers';

const emptyAnswers: IntakeAnswers = {
  childAge: '',
  diagnosedBy: '',
  diagnoses: [],
  currentSupport: [],
  topConcerns: [],
  freeText: '',
};

export default function IntakePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<IntakeAnswers>(emptyAnswers);
  const [completed, setCompleted] = useState(false);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setAnswers(JSON.parse(saved));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Persist to localStorage on each answer change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {
      // ignore storage errors
    }
  }, [answers]);

  const totalSteps = intakeSteps.length;
  const step = intakeSteps[currentStep - 1];

  const handleSingleSelect = (fieldName: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [fieldName]: value }));
    // Auto-advance for single-select
    advanceStep();
  };

  const handleMultiSelect = (fieldName: string, value: string) => {
    setAnswers((prev) => {
      const current = prev[fieldName as keyof IntakeAnswers] as string[];
      const step = intakeSteps.find((s) => s.fieldName === fieldName);
      const max = step?.maxSelections;

      if (current.includes(value)) {
        return { ...prev, [fieldName]: current.filter((v) => v !== value) };
      }
      // Enforce max selections
      if (max !== undefined && current.length >= max) {
        return prev;
      }
      return { ...prev, [fieldName]: [...current, value] };
    });
  };

  const advanceStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((s) => s + 1);
    } else {
      setCompleted(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSkip = () => {
    setCompleted(true);
  };

  const handleSubmit = () => {
    setCompleted(true);
  };

  const handleStartOver = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setAnswers(emptyAnswers);
    setCurrentStep(1);
    setCompleted(false);
  };

  if (completed) {
    const recommendations: RecommendedAction[] = getRecommendations(answers);
    return <ResultsCard answers={answers} recommendations={recommendations} onStartOver={handleStartOver} />;
  }

  return (
    <StepWrapper currentStep={currentStep} totalSteps={totalSteps} onBack={handleBack}>
      {step.type === 'textarea' ? (
        <TextInputStep
          question={step.question}
          subtitle={step.subtitle}
          placeholder={step.placeholder}
          value={answers.freeText}
          onChange={(val) => setAnswers((prev) => ({ ...prev, freeText: val }))}
          onSkip={handleSkip}
          onSubmit={handleSubmit}
        />
      ) : (
        <QuestionCard
          step={step}
          answers={answers}
          onSingleSelect={handleSingleSelect}
          onMultiSelect={handleMultiSelect}
          onContinue={advanceStep}
        />
      )}
    </StepWrapper>
  );
}
