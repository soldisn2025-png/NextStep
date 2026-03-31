'use client';

import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  MapPin,
  Play,
  RotateCcw,
  X,
  Zap,
} from 'lucide-react';
import { getActionPlanGuidance } from '@/lib/actionPlan';
import { formatRelativeUpdate } from '@/lib/actionPlanState';
import { getLocalResourcesForAction } from '@/lib/localResources';
import { getProviderSearchKindForAction } from '@/lib/providerSearchConfig';
import {
  ActionPlanProgressEntry,
  ActionPlanStatus,
  LocalResource,
  RecommendedAction,
} from '@/lib/types';
import ActionAIAssistant from './ActionAIAssistant';
import ActionExecutionWorkspace from './ActionExecutionWorkspace';
import ActionStepTracker from './ActionStepTracker';
import NearbyProviders from './NearbyProviders';

interface ActionPlanCardProps {
  action: RecommendedAction;
  displayIndex: number;
  savedZip: string;
  entry?: ActionPlanProgressEntry;
  onUpdateStatus: (actionId: string, status: ActionPlanStatus) => void;
  onUpdateEntry: (actionId: string, updates: Partial<ActionPlanProgressEntry>) => void;
}

const categoryMeta: Record<
  RecommendedAction['category'],
  { label: string; className: string }
> = {
  therapy: { label: 'Therapy', className: 'bg-[#edf4ff] text-[#48607f] border-[#d6e3f8]' },
  school: { label: 'School / Services', className: 'bg-[#f4efff] text-[#5e5585] border-[#ddd3fb]' },
  insurance: { label: 'Insurance', className: 'bg-[#fff3e1] text-[#8a6641] border-[#f0debd]' },
  community: { label: 'Community', className: 'bg-[#edf7ef] text-[#4a6a54] border-[#d3e6d5]' },
  parent: { label: 'For You', className: 'bg-[#fbf0ef] text-[#8a5e5b] border-[#f0d6d2]' },
};

const statusMeta: Record<
  ActionPlanStatus,
  { label: string; className: string; cardClass: string }
> = {
  'not-started': {
    label: 'Not started',
    className: 'bg-white text-[#6f6a5b] border-[#ddd1bc]',
    cardClass: 'bg-[#fffdf8] border-[#e5dbc9]',
  },
  'in-progress': {
    label: 'Working on it',
    className: 'bg-[#f2efde] text-[#676540] border-[#d9d3b6]',
    cardClass: 'bg-[#fcfaf1] border-[#d9d1b7]',
  },
  done: {
    label: 'Done',
    className: 'bg-[#edf6e7] text-[#4f6d4e] border-[#d4e4c8]',
    cardClass: 'bg-[#f9fbf1] border-[#d7e1c7]',
  },
  skipped: {
    label: 'Skipped',
    className: 'bg-[#f5f2ec] text-[#726a5f] border-[#e2dbcf]',
    cardClass: 'bg-[#fcfaf6] border-[#e5dccf]',
  },
};

const urgencyConfig: Record<
  RecommendedAction['urgency'],
  { label: string; icon: LucideIcon; className: string; accentClass: string }
> = {
  immediate: {
    label: 'Immediate',
    icon: Zap,
    className: 'bg-[#fff0ed] text-[#b25b4b] border-[#f3d2ca]',
    accentClass: 'before:bg-[#f1d7cf]',
  },
  soon: {
    label: 'Soon',
    icon: Clock,
    className: 'bg-[#fff7e9] text-[#9c6a27] border-[#f2dfb9]',
    accentClass: 'before:bg-[#f3e5bf]',
  },
  'when-ready': {
    label: 'When ready',
    icon: Calendar,
    className: 'bg-[#f4f1ec] text-[#7a7468] border-[#e2dbcf]',
    accentClass: 'before:bg-[#e7e0d2]',
  },
};

const localSectionMeta: Record<
  LocalResource['kind'],
  { heading: string; containerClass: string; labelClass: string }
> = {
  'official-program': {
    heading: 'Local programs near you',
    containerClass: 'bg-[#eef3ff] border-[#dbe4f8]',
    labelClass: 'text-[#516a8a]',
  },
  'parent-group': {
    heading: 'Parent and community groups',
    containerClass: 'bg-[#eef6ef] border-[#d9e8db]',
    labelClass: 'text-[#516a57]',
  },
  provider: {
    heading: 'Private providers',
    containerClass: 'bg-[#f6f1ff] border-[#e1d7f5]',
    labelClass: 'text-[#675985]',
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

function getPluralLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export default function ActionPlanCard({
  action,
  displayIndex,
  savedZip,
  entry,
  onUpdateStatus,
  onUpdateEntry,
}: ActionPlanCardProps) {
  const status = entry?.status ?? 'not-started';
  const updatedAt = entry?.updatedAt;
  const guidance = getActionPlanGuidance(action.id);
  const urgency = urgencyConfig[action.urgency];
  const UrgencyIcon = urgency.icon;
  const localResources = savedZip ? getLocalResourcesForAction(action.id, savedZip) : [];
  const providerSearchKind = savedZip ? getProviderSearchKindForAction(action.id) : null;
  const groupedLocalResources = groupLocalResources(localResources);
  const localKinds = (Object.keys(groupedLocalResources) as LocalResource['kind'][]).filter(
    (kind) => groupedLocalResources[kind].length > 0
  );
  const savedDraftCount = entry?.savedDrafts?.length ?? 0;
  const executionLogCount = entry?.executionLog?.length ?? 0;
  const hasResourceHub = Boolean(
    (action.resources?.length ?? 0) > 0 ||
      localKinds.length > 0 ||
      providerSearchKind ||
      (action.supportItems?.length ?? 0) > 0
  );
  const [showResources, setShowResources] = useState(false);
  const [showTools, setShowTools] = useState(savedDraftCount > 0 || executionLogCount > 0);
  const resourceSummary = [
    action.resources?.length
      ? getPluralLabel(action.resources.length, 'trusted link')
      : null,
    localResources.length
      ? getPluralLabel(localResources.length, 'local listing')
      : null,
    providerSearchKind ? 'live nearby search' : null,
    action.supportItems?.length
      ? getPluralLabel(action.supportItems.length, 'support item')
      : null,
  ]
    .filter(Boolean)
    .join(' / ');
  const toolsSummary = [
    savedDraftCount ? getPluralLabel(savedDraftCount, 'saved draft') : null,
    executionLogCount ? getPluralLabel(executionLogCount, 'logged activity', 'logged activities') : null,
  ]
    .filter(Boolean)
    .join(' / ');

  return (
    <div
      id={`action-${action.id}`}
      className={`relative overflow-hidden rounded-[30px] border px-5 py-5 shadow-[0_24px_64px_-42px_rgba(54,44,28,0.5)] before:absolute before:left-0 before:top-0 before:h-full before:w-1.5 before:content-[''] sm:px-6 sm:py-6 ${statusMeta[status].cardClass} ${urgency.accentClass}`}
    >
      <div className="relative">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] font-body ${urgency.className}`}
            >
              <UrgencyIcon size={12} className="mr-1.5" />
              {urgency.label}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] font-body ${categoryMeta[action.category].className}`}
            >
              {categoryMeta[action.category].label}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] font-body ${statusMeta[status].className}`}
            >
              {statusMeta[status].label}
            </span>
          </div>
          <div className="text-left md:text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-[#8a8377] font-body">
              Step {displayIndex}
            </p>
            {updatedAt && (
              <p className="mt-1 text-xs text-[#8a8377] font-body">
                {formatRelativeUpdate(updatedAt)}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <h3 className="font-heading text-[1.9rem] leading-tight text-text-main">
            {action.title}
          </h3>
          <p className="mt-3 max-w-3xl text-sm text-[#625e53] font-body leading-relaxed">
            {action.description}
          </p>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <div className="rounded-[24px] border border-[#e5dccb] bg-white/80 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#8a8377] font-body">
              First move
            </p>
            <p className="mt-2 text-sm text-[#4f4b42] font-body leading-relaxed">
              {guidance.firstMove}
            </p>
          </div>
          <div className="rounded-[24px] border border-[#e5dccb] bg-white/80 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#8a8377] font-body">
              While you wait
            </p>
            <p className="mt-2 text-sm text-[#4f4b42] font-body leading-relaxed">
              {guidance.whileWaiting ??
                'If this step feels blocked, write down what is slowing you down so the next call or appointment gets more specific.'}
            </p>
          </div>
        </div>

        <ActionStepTracker
          actionId={action.id}
          action={action}
          actionTitle={action.title}
          entry={entry}
          status={status}
          onUpdate={(updates) => onUpdateEntry(action.id, updates)}
        />

        <div className="mt-5 space-y-3">
          {hasResourceHub && (
            <div className="rounded-[24px] border border-[#e4dac8] bg-white/82 px-4 py-4">
              <button
                type="button"
                onClick={() => setShowResources((current) => !current)}
                aria-expanded={showResources}
                className="flex w-full items-start justify-between gap-3 text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef3ff] text-primary">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
                      Local help and resources
                    </p>
                    <h4 className="mt-1 font-heading text-xl text-text-main">
                      Keep providers and reference links out of the way until you need them.
                    </h4>
                    <p className="mt-2 text-sm text-[#625e53] font-body leading-relaxed">
                      {resourceSummary || 'Open this section to see trusted links, local programs, and nearby provider options.'}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#ddd3bf] bg-[#fffdf8] px-3 py-1.5 text-xs text-[#5a5549] font-body">
                  {showResources ? 'Hide' : 'Open'}
                  {showResources ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </span>
              </button>

              {showResources && (
                <div className="mt-4 border-t border-[#ece3d4] pt-4">
                  {action.resources && action.resources.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body mb-2">
                        Trusted resources
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {action.resources.map((resource) => (
                          <a
                            key={resource.url}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#ddd3bf] bg-white px-3 py-1.5 text-xs text-primary hover:border-primary/40 hover:shadow-sm transition-all font-body"
                          >
                            {resource.label}
                            <ExternalLink size={11} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {localKinds.length > 0 && (
                    <div className="mt-5 space-y-3">
                      {localKinds.map((kind) => {
                        const meta = localSectionMeta[kind];
                        const items = groupedLocalResources[kind];

                        return (
                          <div
                            key={kind}
                            className={`rounded-[24px] border px-4 py-4 ${meta.containerClass}`}
                          >
                            <p className={`text-xs uppercase tracking-[0.18em] font-body mb-3 ${meta.labelClass}`}>
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
                                  <p className="mt-1 text-sm text-[#625e53] font-body leading-relaxed">
                                    {resource.description}
                                  </p>
                                  <p className="mt-1 text-xs text-[#8a8377] font-body">
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

                  {savedZip && <NearbyProviders actionId={action.id} zip={savedZip} />}

                  {action.supportItems && action.supportItems.length > 0 && (
                    <div className="mt-5 rounded-[24px] border border-[#efdfbc] bg-[#fff7e7] px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-[#9a6a27] font-body mb-2">
                        Helpful items
                      </p>
                      <p className="text-sm text-[#625e53] font-body leading-relaxed mb-3">
                        Optional items families often explore while building routines or waiting for services to start.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {action.supportItems.map((item) => (
                          <a
                            key={item.url}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#e7d4a8] bg-white px-3 py-1.5 text-xs text-primary hover:border-primary/40 transition-all font-body"
                          >
                            {item.label}
                            <ExternalLink size={11} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="rounded-[24px] border border-[#e4dac8] bg-white/82 px-4 py-4">
            <button
              type="button"
              onClick={() => setShowTools((current) => !current)}
              aria-expanded={showTools}
              className="flex w-full items-start justify-between gap-3 text-left"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f6f1ff] text-[#675985]">
                  <Bot size={16} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
                    Drafts and outreach log
                  </p>
                  <h4 className="mt-1 font-heading text-xl text-text-main">
                    Open the AI helper only when this step actually needs it.
                  </h4>
                  <p className="mt-2 text-sm text-[#625e53] font-body leading-relaxed">
                    {toolsSummary ||
                      'Generate a draft, save it, and log real outreach here without making every card feel heavy.'}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#ddd3bf] bg-[#fffdf8] px-3 py-1.5 text-xs text-[#5a5549] font-body">
                {showTools ? 'Hide' : 'Open'}
                {showTools ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </span>
            </button>

            {showTools && (
              <div className="mt-4 border-t border-[#ece3d4] pt-4">
                <ActionAIAssistant
                  actionId={action.id}
                  actionTitle={action.title}
                  actionDescription={action.description}
                  entry={entry}
                  onUpdate={(updates) => onUpdateEntry(action.id, updates)}
                />

                <ActionExecutionWorkspace
                  entry={entry}
                  status={status}
                  onUpdate={(updates) => onUpdateEntry(action.id, updates)}
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-[#ece3d4] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              {status !== 'done' && status !== 'skipped' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(action.id, 'in-progress')}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-body transition-colors ${
                    status === 'in-progress'
                      ? 'border-[#d5cfaf] bg-[#ebe7d4] text-[#676540]'
                      : 'border-[#ddd3bf] bg-white text-[#5a5549] hover:border-[#7f7a57] hover:text-[#504b40]'
                  }`}
                >
                  <Play size={14} />
                  {status === 'in-progress' ? 'Working on this' : 'Start this'}
                </button>
              )}
              {status !== 'skipped' && (
                <>
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(action.id, 'skipped')}
                    className="inline-flex items-center gap-2 rounded-full border border-[#ddd3bf] bg-white px-4 py-2 text-sm text-[#5a5549] font-body transition-colors hover:border-[#7f7a57] hover:text-[#504b40]"
                  >
                    <X size={14} />
                    Skip this
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateStatus(action.id, status === 'done' ? 'not-started' : 'done')
                    }
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-body transition-colors ${
                      status === 'done'
                        ? 'border border-[#d5cfaf] bg-white text-[#5a5549] hover:border-[#7f7a57] hover:text-[#504b40]'
                        : 'bg-[#6d6b47] text-white hover:bg-[#5a583a]'
                    }`}
                  >
                    {status === 'done' ? <RotateCcw size={14} /> : <CheckCircle2 size={14} />}
                    {status === 'done' ? 'Reopen step' : 'Mark as done'}
                  </button>
                </>
              )}
            </div>
            {status !== 'done' && status !== 'skipped' && (
              <p className="mt-2 text-xs text-[#8a8377] font-body">
                Done steps move into the green completed section. Skipped steps move into the skipped section.
              </p>
            )}
          </div>
          <p className="text-xs text-[#8a8377] font-body">
            Saved on this device{savedZip ? ` | ZIP ${savedZip}` : ''}.
          </p>
        </div>
      </div>
    </div>
  );
}
