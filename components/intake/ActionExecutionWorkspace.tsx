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
} from '@/lib/executionTools';
import {
  ActionExecutionDraft,
  ActionPlanProgressEntry,
  ActionPlanStatus,
  AppLocale,
  ExecutionLogType,
} from '@/lib/types';

interface ActionExecutionWorkspaceProps {
  entry?: ActionPlanProgressEntry;
  status: ActionPlanStatus;
  locale?: AppLocale;
  onUpdate: (updates: Partial<ActionPlanProgressEntry>) => void;
}

const quickActionButtons: Array<{
  type: ExecutionLogType;
  label: string;
  labelKr: string;
  icon: typeof MailCheck;
}> = [
  { type: 'email-sent', label: 'Email sent', labelKr: '이메일 발송', icon: MailCheck },
  { type: 'call-made', label: 'Call made', labelKr: '전화 완료', icon: PhoneCall },
  { type: 'voicemail-left', label: 'Voicemail left', labelKr: '음성메시지 남김', icon: PhoneOutgoing },
  { type: 'meeting-booked', label: 'Meeting booked', labelKr: '미팅 예약', icon: Users },
  { type: 'form-submitted', label: 'Form submitted', labelKr: '양식 제출', icon: ClipboardCheck },
];

const EXECUTION_LOG_LABELS_KR: Record<ExecutionLogType, string> = {
  'email-sent': '이메일 발송',
  'call-made': '전화 완료',
  'voicemail-left': '음성메시지 남김',
  'meeting-booked': '미팅 예약',
  'form-submitted': '양식 제출',
};

const MODE_LABELS_KR: Record<string, string> = {
  'draft-email': '이메일 초안',
  'call-script': '전화 스크립트',
  'meeting-questions': '미팅 질문',
  'summarize-notes': '메모 요약',
};

function getTodayDateValue() {
  return new Date().toISOString().slice(0, 10);
}

export default function ActionExecutionWorkspace({
  entry,
  status,
  locale,
  onUpdate,
}: ActionExecutionWorkspaceProps) {
  const savedDrafts = entry?.savedDrafts ?? [];
  const executionLog = entry?.executionLog ?? [];
  const [selectedDraftId, setSelectedDraftId] = useState<string>('');
  const [draftEditor, setDraftEditor] = useState('');
  const [logNote, setLogNote] = useState('');
  const [copied, setCopied] = useState(false);

  const isKorean = locale === 'ko-KR';

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

  const getDraftModeLabel = (draft: ActionExecutionDraft) => {
    if (isKorean) {
      return MODE_LABELS_KR[draft.mode] ?? draft.mode;
    }
    const meta = EXECUTION_LOG_META[draft.mode as ExecutionLogType];
    if (meta) return meta.label;
    switch (draft.mode) {
      case 'draft-email': return 'Draft email';
      case 'call-script': return 'Call script';
      case 'meeting-questions': return 'Meeting questions';
      case 'summarize-notes': return 'Summary';
      default: return 'Saved draft';
    }
  };

  const latestActivity = executionLog.slice(0, 4);

  return (
    <div className="mt-5 rounded-[24px] border border-[#ded5c3] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,244,236,0.98))] px-4 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#8a8377] font-body">
            {isKorean ? '실행 워크스페이스' : 'Execution workspace'}
          </p>
          <h4 className="mt-2 font-heading text-xl text-text-main">
            {isKorean ? '초안을 실제 행동으로 옮기세요.' : 'Turn drafts into actual outreach.'}
          </h4>
          <p className="mt-2 text-sm text-[#625e53] font-body leading-relaxed">
            {isKorean
              ? '저장하고 싶은 AI 결과를 수정하고, 실제로 보내거나 전화한 내용을 기록하세요.'
              : 'Save the AI output you want to keep, edit it here, and log what you actually sent, called, or scheduled.'}
          </p>
        </div>
        <p className="text-xs text-[#8a8377] font-body leading-relaxed lg:max-w-xs lg:text-right">
          {isKorean
            ? '실제 행동을 기록하면 오늘이 마지막 연락일로 자동 저장됩니다.'
            : 'Logging a real action automatically records today as the last contact date and keeps the step in progress.'}
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
                  {getDraftModeLabel(draft)}
                </button>
              ))
            ) : (
              <p className="text-sm text-[#8a8377] font-body">
                {isKorean
                  ? '저장된 초안이 없습니다. AI 도우미에서 생성 후 저장하세요.'
                  : 'No saved drafts yet. Generate one in the AI helper and save it to this step.'}
              </p>
            )}
          </div>

          {selectedDraft && (
            <>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
                    {getDraftModeLabel(selectedDraft)}
                  </p>
                  <p className="mt-1 text-xs text-[#8a8377] font-body">
                    {isKorean
                      ? `${formatExecutionTimestamp(selectedDraft.updatedAt)} 수정됨`
                      : `Updated ${formatExecutionTimestamp(selectedDraft.updatedAt)}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleCopyDraft}
                    className="inline-flex items-center gap-2 rounded-full border border-[#ddd3bf] bg-white px-3 py-2 text-xs text-[#5a5549] font-body transition-colors hover:border-[#7f7a57] hover:text-[#504b40]"
                  >
                    <Copy size={13} />
                    {copied ? (isKorean ? '복사됨' : 'Copied') : (isKorean ? '복사' : 'Copy')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDraftEdits}
                    className="inline-flex items-center gap-2 rounded-full bg-[#6d6b47] px-3 py-2 text-xs text-white font-body transition-colors hover:bg-[#5a583a]"
                  >
                    <Save size={13} />
                    {isKorean ? '수정 저장' : 'Save edits'}
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
              {isKorean ? '활동 기록' : 'Log real activity'}
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
                    {isKorean ? button.labelKr : button.label}
                  </button>
                );
              })}
            </div>
            <textarea
              value={logNote}
              onChange={(event) => setLogNote(event.target.value)}
              placeholder={
                isKorean
                  ? '선택 메모: 누가 응답했는지, 무엇을 요청했는지, 다음 할 일을 적으세요.'
                  : 'Optional note: who responded, what was asked for, or what to do next.'
              }
              className="mt-3 min-h-[92px] w-full resize-y rounded-[18px] border border-[#e3dac9] bg-[#fffdf9] px-4 py-3 text-sm text-text-main font-body outline-none transition-all placeholder:text-[#9b9487] focus:border-[#7f7a57] focus:ring-2 focus:ring-[#7f7a57]/15"
            />
          </div>

          <div className="rounded-[20px] border border-[#e6dccb] bg-white/88 px-4 py-4">
            <div className="flex items-center gap-2">
              <CheckCheck size={14} className="text-[#7a724b]" />
              <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
                {isKorean ? '최근 활동' : 'Recent activity'}
              </p>
            </div>
            {latestActivity.length > 0 ? (
              <div className="mt-3 space-y-3">
                {latestActivity.map((item) => {
                  const meta = EXECUTION_LOG_META[item.type];
                  const label = isKorean ? EXECUTION_LOG_LABELS_KR[item.type] : meta.label;

                  return (
                    <div key={item.id} className="rounded-[16px] border border-[#ece3d4] bg-[#fffdf8] px-3 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.16em] font-body ${meta.toneClass}`}>
                          {label}
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
                {isKorean
                  ? '아직 기록된 활동이 없습니다.'
                  : 'No outreach has been logged yet for this step.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
