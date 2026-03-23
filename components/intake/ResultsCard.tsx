'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { IntakeAnswers, LocalResource, RecommendedAction } from '@/lib/types';
import { intakeSteps } from '@/lib/intakeSteps';
import { ArrowLeft, Calendar, CheckCircle, Clock, ExternalLink, MapPin, Zap } from 'lucide-react';
import { getLocationMatch, getLocalResourcesForAction, LOCAL_PILOT_SUMMARY } from '@/lib/localResources';

interface ResultsCardProps {
  answers: IntakeAnswers;
  recommendations: RecommendedAction[];
  onStartOver: () => void;
}

const ZIP_STORAGE_KEY = 'nextstep_local_zip';

const fieldLabels: Record<string, string> = {
  childAge: "Child's age",
  diagnosedBy: 'Diagnosed by',
  diagnoses: 'Diagnoses',
  currentSupport: 'Current support',
  topConcerns: 'Top concerns',
  freeText: 'Additional context',
};

const categoryColors: Record<RecommendedAction['category'], string> = {
  therapy: 'bg-blue-50 text-blue-700',
  school: 'bg-purple-50 text-purple-700',
  insurance: 'bg-amber-50 text-amber-700',
  community: 'bg-green-50 text-green-700',
  parent: 'bg-rose-50 text-rose-700',
};

const categoryLabels: Record<RecommendedAction['category'], string> = {
  therapy: 'Therapy',
  school: 'School / Services',
  insurance: 'Insurance',
  community: 'Community',
  parent: 'For You',
};

const urgencyConfig: Record<
  RecommendedAction['urgency'],
  { label: string; icon: LucideIcon; color: string }
> = {
  immediate: { label: 'Do this first', icon: Zap, color: 'text-red-500' },
  soon: { label: 'Do this soon', icon: Clock, color: 'text-amber-500' },
  'when-ready': { label: 'When ready', icon: Calendar, color: 'text-gray-400' },
};

const localSectionMeta: Record<
  LocalResource['kind'],
  { heading: string; containerClass: string; labelClass: string }
> = {
  'official-program': {
    heading: 'Local programs near you',
    containerClass: 'bg-sky-50 border-sky-100',
    labelClass: 'text-sky-700',
  },
  'parent-group': {
    heading: 'Parent and community groups',
    containerClass: 'bg-emerald-50 border-emerald-100',
    labelClass: 'text-emerald-700',
  },
  provider: {
    heading: 'Private providers',
    containerClass: 'bg-violet-50 border-violet-100',
    labelClass: 'text-violet-700',
  },
};

function groupLocalResources(resources: LocalResource[]) {
  return resources.reduce(
    (groups, resource) => {
      groups[resource.kind].push(resource);
      return groups;
    },
    {
      'official-program': [] as LocalResource[],
      'parent-group': [] as LocalResource[],
      provider: [] as LocalResource[],
    }
  );
}

export default function ResultsCard({ answers, recommendations, onStartOver }: ResultsCardProps) {
  const [zipInput, setZipInput] = useState('');
  const [savedZip, setSavedZip] = useState('');
  const [zipError, setZipError] = useState('');

  useEffect(() => {
    try {
      const storedZip = localStorage.getItem(ZIP_STORAGE_KEY) ?? '';
      setZipInput(storedZip);
      setSavedZip(storedZip);
    } catch {
      // ignore storage errors
    }
  }, []);

  const locationMatch = useMemo(() => getLocationMatch(savedZip), [savedZip]);
  const hasSupportedRegion = Boolean(locationMatch && locationMatch.regionIds.length > 0);

  const handleZipSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = zipInput.replace(/\D/g, '').slice(0, 5);

    if (normalized.length !== 5) {
      setZipError('Enter a valid 5-digit ZIP code.');
      return;
    }

    try {
      localStorage.setItem(ZIP_STORAGE_KEY, normalized);
    } catch {
      // ignore storage errors
    }

    setZipError('');
    setZipInput(normalized);
    setSavedZip(normalized);
  };

  const handleClearZip = () => {
    try {
      localStorage.removeItem(ZIP_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }

    setZipError('');
    setZipInput('');
    setSavedZip('');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <CheckCircle size={48} className="text-success" />
        </div>
        <h2 className="font-heading text-2xl text-text-main mb-2">Your next steps</h2>
        <p className="text-sm text-gray-500 font-body">
          Based on what you shared, here&apos;s where to focus your energy.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <MapPin size={18} />
          </div>
          <div>
            <h3 className="font-heading text-base text-text-main mb-1">Add local help near you</h3>
            <p className="text-sm text-gray-500 font-body leading-relaxed">
              Enter a ZIP code to layer in curated public programs and parent groups without changing your core results.
            </p>
          </div>
        </div>

        <form onSubmit={handleZipSubmit} className="flex flex-col sm:flex-row gap-2">
          <label htmlFor="localZip" className="sr-only">
            ZIP code for local resources
          </label>
          <input
            id="localZip"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            value={zipInput}
            onChange={(event) => {
              setZipError('');
              setZipInput(event.target.value.replace(/\D/g, '').slice(0, 5));
            }}
            placeholder="ZIP code"
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-text-main font-body outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          <button
            type="submit"
            className="rounded-xl bg-primary text-white px-4 py-2.5 text-sm font-body hover:opacity-95 transition-opacity"
          >
            Show local resources
          </button>
          {savedZip && (
            <button
              type="button"
              onClick={handleClearZip}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-500 font-body hover:text-primary hover:border-primary transition-colors"
            >
              Clear
            </button>
          )}
        </form>

        <p className="mt-3 text-xs text-gray-400 font-body">{LOCAL_PILOT_SUMMARY}</p>
        {zipError && <p className="mt-2 text-sm text-red-500 font-body">{zipError}</p>}
        {!zipError && savedZip && hasSupportedRegion && locationMatch?.primaryRegionLabel && (
          <p className="mt-2 text-sm text-success font-body">
            Showing curated local resources for {locationMatch.primaryRegionLabel}.
          </p>
        )}
        {!zipError && savedZip && !hasSupportedRegion && (
          <p className="mt-2 text-sm text-amber-600 font-body">
            We do not have curated resources for ZIP {savedZip} yet. Your recommendations below still work nationally.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4 mb-10">
        {recommendations.map((action, index) => {
          const urgency = urgencyConfig[action.urgency];
          const UrgencyIcon = urgency.icon;
          const localResources = savedZip ? getLocalResourcesForAction(action.id, savedZip) : [];
          const groupedLocalResources = groupLocalResources(localResources);
          const localKinds = (Object.keys(groupedLocalResources) as LocalResource['kind'][]).filter(
            (kind) => groupedLocalResources[kind].length > 0
          );

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
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-400 font-body mb-2">
                    Trusted national resources
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {action.resources.map((resource) => (
                      <a
                        key={resource.url}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline underline-offset-2 font-body"
                      >
                        <ExternalLink size={11} />
                        {resource.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {localKinds.length > 0 && (
                <div className="mt-4 space-y-3">
                  {localKinds.map((kind) => {
                    const meta = localSectionMeta[kind];
                    const items = groupedLocalResources[kind];

                    return (
                      <div
                        key={kind}
                        className={`rounded-2xl border px-4 py-3 ${meta.containerClass}`}
                      >
                        <p className={`text-xs uppercase tracking-[0.18em] font-body mb-2 ${meta.labelClass}`}>
                          {meta.heading}
                        </p>
                        <div className="space-y-3">
                          {items.map((resource) => (
                            <div key={resource.id}>
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-text-main hover:text-primary transition-colors font-body"
                              >
                                <ExternalLink size={12} />
                                <span className="font-medium">{resource.label}</span>
                              </a>
                              <p className="text-sm text-gray-500 font-body leading-relaxed mt-1">
                                {resource.description}
                              </p>
                              <p className="text-xs text-gray-400 font-body mt-1">
                                Verified {resource.verifiedAt}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {action.supportItems && action.supportItems.length > 0 && (
                <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-body mb-2">
                    Helpful items
                  </p>
                  <p className="text-sm text-gray-500 font-body leading-relaxed mb-2">
                    Optional items families often explore while waiting for services or building routines at home.
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {action.supportItems.map((item) => (
                      <a
                        key={item.url}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline underline-offset-2 font-body"
                      >
                        <ExternalLink size={11} />
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <details className="mb-6">
        <summary className="text-sm text-gray-400 font-body cursor-pointer select-none hover:text-primary transition-colors">
          View your answers
        </summary>
        <div className="mt-3 bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
          {intakeSteps.map((step) => {
            const val = answers[step.fieldName as keyof IntakeAnswers];
            const isEmpty = !val || (Array.isArray(val) && val.length === 0) || val === '';

            if (isEmpty && step.optional) {
              return null;
            }

            return (
              <div key={step.fieldName} className="px-4 py-3">
                <p className="text-xs text-gray-400 font-body mb-0.5">{fieldLabels[step.fieldName]}</p>
                <p className="text-sm text-text-main font-body">
                  {Array.isArray(val) ? val.join(', ') : val || '-'}
                </p>
              </div>
            );
          })}
        </div>
      </details>

      <p className="text-xs text-gray-400 font-body text-center leading-relaxed mb-6">
        These recommendations are general guidance based on your answers and do not
        constitute medical or therapeutic advice. Always consult a qualified professional.
      </p>

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
