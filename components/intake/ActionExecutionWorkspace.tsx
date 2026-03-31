'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CheckCheck,
  ClipboardCheck,
  Copy,
  MailCheck,
  PhoneCall,
  PhoneOutgoing,
  Save,
  Users,
} from 'lucide-react';
import {
  createExecutionLogEntry,
  createDraftId,
  EXECUTION_LOG_META,
  formatExecutionTimestamp,
  getActionAssistantModeLabel,
} from '@/lib/executionTools';
import {
  ActionExecutionDraft,
  ActionPlanProgressEntry,
  ActionPlanStatus,
  ExecutionLogType,
} from '@/lib/types';

interface ActionExecutionWorkspaceProps {
  entry?: ActionPlanProgressEntry;
  status: ActionPlanStatus;
  onUpdate: (updates: Partial<ActionPlanProgressEntry>) => void;
}

const quickActionButtons: Array<{
  type: ExecutionLogType;
  label: string;
  icon: typeof MailCheck;
}> = [
  { type: 'email-sent', label: 'Email sent', icon: MailCheck },
  { type: 'call-made', label: 'Call made', icon: PhoneCall },
  { type: 'voicemail-left', label: 'Voicemail left', icon: PhoneOutgoing },
  { type: 'meeting-booked', label: 'Meeting booked', icon: Users },
  { type: 'form-submitted', label: 'Form submitted', icon: ClipboardCheck },
];

function getTodayDateValue() {
  return new Date().toISOString().slice(0, 10);
}

export default function ActionExecutionWorkspace({
  entry,
  status,
  onUpdate,
}: ActionExecutionWorkspaceProps) {
  const savedDrafts = entry?.savedDrafts ?? [];
  const executionLog = entry?.executionLog ?? [];
  const [selectedDraftId, setSelectedDraftId] = useState<string>('');
  const [draftEditor, setDraftEditor] = useState('');
  const [logNote, setLogNote] = useState('');
  const [copied, setCopied] = useState(false);

  const selectedDraft = useMemo(
    () => savedDrafts.find((draft) => draft.id === selectedDraftId) ?? savedDrafts[0] ?? null,
    [savedDrafts, selectedDraftId]
  );

  useEffect(() => {
    if (!selectedDraft) {
      setSelectedDraftId('');
      setDraftEditor('');
      return;
    }

    setSelectedDraftId(selectedDraft.id);
    setDraftEditor(selectedDraft.content);
  }, [selectedDraft?.id, selectedDraft?.content]);

  const handleSaveDraftEdits = () => {
    if (!selectedDraft) {
      return;
    }

    const trimmedContent = draftEditor.trim();
    if (!trimmedContent) {
      return;
    }

    onUpdate({
      savedDrafts: savedDrafts.map((draft) =>
        draft.id === selectedDraft.id
          ? {
              ...draft,
              content: trimmedContent,
              updatedAt: new Date().toISOString(),
            }
          : draft
      ),
      status: status === 'done' ? 'done' : 'in-progress',
    });
  };

  const handleCopyDraft = async () => {
    if (!selectedDraft) {
      return;
    }

    try {
      await navigator.clipboard.writeText(draftEditor);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleQuickLog = (type: ExecutionLogType) => {
    const entryNote = logNote.trim();
    onUpdate({
      executionLog: [createExecutionLogEntry(type, entryNote), ...executionLog].slice(0, 12),
      lastContactDate: getTodayDateValue(),
      status: status === 'done' ? 'done' : 'in-progress',
    });
    setLogNote('');
  };

  const latestActivity = executionLog.slice(0, 4);

  return (
    <div className="mt-5 rounded-[24px] border border-[#ded5c3] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,244,236,0.98))] px-4 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#8a8377] font-body">
            Execution workspace
          </p>
          <h4 className="mt-2 font-heading text-xl text-text-main">Turn drafts into actual outreach.</h4>
          <p className="mt-2 text-sm text-[#625e53] font-body leading-relaxed">
            Save the AI output you want to keep, edit it here, and log what you actually sent, called, or scheduled.
          </p>
        </div>
        <p className="text-xs text-[#8a8377] font-body leading-relaxed lg:max-w-xs lg:text-right">
          Logging a real action automatically records today as the last contact date and keeps the step in progress.
        </p>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[20px] border border-[#e6dccb] bg-white/88 px-4 py-4">
          <div className="flex flex-wrap gap-2">
            {savedDrafts.length > 0 ? (
              savedDrafts.map((draft) => (
                <button
                  key={draft.id}
                  type="button"
                  onClick={() => setSelectedDraftId(draft.id)}
                  className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-body transition-colors ${
                    selectedDraft?.id === draft.id
                      ? 'border-[#d7d0b9] bg-[#efe9d7] text-[#5b583d]'
                      : 'border-[#ddd3bf] bg-white text-[#5a5549] hover:border-[#7f7a57] hover:text-[#504b40]'
                  }`}
                >
                  {getActionAssistantModeLabel(draft.mode)}
                </button>
              ))
            ) : (
              <p className="text-sm text-[#8a8377] font-body">
                No saved drafts yet. Generate one in the AI helper and save it to this step.
              </p>
            )}
          </div>

          {selectedDraft && (
            <>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
                    {getActionAssistantModeLabel(selectedDraft.mode)}
                  </p>
                  <p className="mt-1 text-xs text-[#8a8377] font-body">
                    Updated {formatExecutionTimestamp(selectedDraft.updatedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleCopyDraft}
                    className="inline-flex items-center gap-2 rounded-full border border-[#ddd3bf] bg-white px-3 py-2 text-xs text-[#5a5549] font-body transition-colors hover:border-[#7f7a57] hover:text-[#504b40]"
                  >
                    <Copy size={13} />
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDraftEdits}
                    className="inline-flex items-center gap-2 rounded-full bg-[#6d6b47] px-3 py-2 text-xs text-white font-body transition-colors hover:bg-[#5a583a]"
                  >
                    <Save size={13} />
                    Save edits
                  </button>
                </div>
              </div>

              <textarea
                value={draftEditor}
                onChange={(event) => setDraftEditor(event.target.value)}
                className="mt-3 min-h-[170px] w-full resize-y rounded-[18px] border border-[#e3dac9] bg-[#fffdf9] px-4 py-3 text-sm text-text-main font-body outline-none transition-all focus:border-[#7f7a57] focus:ring-2 focus:ring-[#7f7a57]/15"
              />
            </>
          )}
        </div>

        <div className="grid gap-3">
          <div className="rounded-[20px] border border-[#e6dccb] bg-white/88 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
              Log real activity
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {quickActionButtons.map((button) => {
                const Icon = button.icon;

                return (
                  <button
                    key={button.type}
                    type="button"
                    onClick={() => handleQuickLog(button.type)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#ddd3bf] bg-white px-3 py-2 text-xs text-[#5a5549] font-body transition-colors hover:border-[#7f7a57] hover:text-[#504b40]"
                  >
                    <Icon size={13} />
                    {button.label}
                  </button>
                );
              })}
            </div>
            <textarea
              value={logNote}
              onChange={(event) => setLogNote(event.target.value)}
              placeholder="Optional note: who responded, what was asked for, or what to do next."
              className="mt-3 min-h-[92px] w-full resize-y rounded-[18px] border border-[#e3dac9] bg-[#fffdf9] px-4 py-3 text-sm text-text-main font-body outline-none transition-all placeholder:text-[#9b9487] focus:border-[#7f7a57] focus:ring-2 focus:ring-[#7f7a57]/15"
            />
          </div>

          <div className="rounded-[20px] border border-[#e6dccb] bg-white/88 px-4 py-4">
            <div className="flex items-center gap-2">
              <CheckCheck size={14} className="text-[#7a724b]" />
              <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
                Recent activity
              </p>
            </div>
            {latestActivity.length > 0 ? (
              <div className="mt-3 space-y-3">
                {latestActivity.map((item) => {
                  const meta = EXECUTION_LOG_META[item.type];

                  return (
                    <div key={item.id} className="rounded-[16px] border border-[#ece3d4] bg-[#fffdf8] px-3 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.16em] font-body ${meta.toneClass}`}>
                          {meta.label}
                        </span>
                        <span className="text-xs text-[#8a8377] font-body">
                          {formatExecutionTimestamp(item.createdAt)}
                        </span>
                      </div>
                      {item.note && (
                        <p className="mt-2 text-sm text-[#625e53] font-body leading-relaxed">
                          {item.note}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[#8a8377] font-body">
                No outreach has been logged yet for this step.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
