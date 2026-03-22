'use client';

import type { LucideIcon } from 'lucide-react';
import { IntakeAnswers, RecommendedAction } from '@/lib/types';
import { intakeSteps } from '@/lib/intakeSteps';
import { CheckCircle, Clock, Zap, Calendar, ExternalLink, ArrowLeft } from 'lucide-react';

interface ResultsCardProps {
  answers: IntakeAnswers;
  recommendations: RecommendedAction[];
  onStartOver: () => void;
}

const fieldLabels: Record<string, string> = {
  childAge: "Child's age",
  diagnosedBy: 'Diagnosed by',
  diagnoses: 'Diagnoses',
  currentSupport: 'Current support',
  topConcerns: 'Top concerns',
  freeText: 'Additional context',
};

const categoryColors: Record<RecommendedAction['category'], string> = {
  therapy:   'bg-blue-50 text-blue-700',
  school:    'bg-purple-50 text-purple-700',
  insurance: 'bg-amber-50 text-amber-700',
  community: 'bg-green-50 text-green-700',
  parent:    'bg-rose-50 text-rose-700',
};

const categoryLabels: Record<RecommendedAction['category'], string> = {
  therapy:   'Therapy',
  school:    'School / Services',
  insurance: 'Insurance',
  community: 'Community',
  parent:    'For You',
};

const urgencyConfig: Record<
  RecommendedAction['urgency'],
  { label: string; icon: LucideIcon; color: string }
> = {
  immediate:    { label: 'Do this first', icon: Zap,      color: 'text-red-500' },
  soon:         { label: 'Do this soon',  icon: Clock,     color: 'text-amber-500' },
  'when-ready': { label: 'When ready',    icon: Calendar,  color: 'text-gray-400' },
};

export default function ResultsCard({ answers, recommendations, onStartOver }: ResultsCardProps) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <CheckCircle size={48} className="text-success" />
        </div>
        <h2 className="font-heading text-2xl text-text-main mb-2">Your next steps</h2>
        <p className="text-sm text-gray-500 font-body">
          Based on what you shared, here's where to focus your energy.
        </p>
      </div>

      {/* Recommendations */}
      <div className="flex flex-col gap-4 mb-10">
        {recommendations.map((action, index) => {
          const urgency = urgencyConfig[action.urgency];
          const UrgencyIcon = urgency.icon;

          return (
            <div
              key={action.id}
              className="bg-white rounded-2xl border border-gray-100 px-5 py-4"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full font-body ${categoryColors[action.category]}`}
                  >
                    {categoryLabels[action.category]}
                  </span>
                  <span className={`flex items-center gap-1 text-xs font-body ${urgency.color}`}>
                    <UrgencyIcon size={12} />
                    {urgency.label}
                  </span>
                </div>
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-400 text-xs font-body flex items-center justify-center">
                  {index + 1}
                </span>
              </div>
              <h3 className="font-heading text-base text-text-main mb-1">{action.title}</h3>
              <p className="text-sm text-gray-500 font-body leading-relaxed">{action.description}</p>
              {action.resources && action.resources.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                  {action.resources.map((r) => (
                    <a
                      key={r.url}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline underline-offset-2 font-body"
                    >
                      <ExternalLink size={11} />
                      {r.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Answer summary (collapsible) */}
      <details className="mb-6">
        <summary className="text-sm text-gray-400 font-body cursor-pointer select-none hover:text-primary transition-colors">
          View your answers
        </summary>
        <div className="mt-3 bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
          {intakeSteps.map((step) => {
            const val = answers[step.fieldName as keyof IntakeAnswers];
            const isEmpty = !val || (Array.isArray(val) && val.length === 0) || val === '';
            if (isEmpty && step.optional) return null;
            return (
              <div key={step.fieldName} className="px-4 py-3">
                <p className="text-xs text-gray-400 font-body mb-0.5">{fieldLabels[step.fieldName]}</p>
                <p className="text-sm text-text-main font-body">
                  {Array.isArray(val) ? val.join(', ') : val || '—'}
                </p>
              </div>
            );
          })}
        </div>
      </details>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 font-body text-center leading-relaxed mb-6">
        These recommendations are general guidance based on your answers and do not
        constitute medical or therapeutic advice. Always consult a qualified professional.
      </p>

      {/* Start over */}
      <div className="flex justify-center">
        <button
          onClick={onStartOver}
          aria-label="Start over and retake the questionnaire"
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary transition-colors font-body"
        >
          <ArrowLeft size={14} />
          Start over
        </button>
      </div>
    </div>
  );
}
