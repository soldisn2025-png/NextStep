'use client';

import { useMemo, useState } from 'react';
import { Copy, FileText, Loader2, Save, Sparkles } from 'lucide-react';
import {
  DOCUMENT_ANALYSIS_OPTIONS,
  getDocumentAnalysisLabel,
} from '@/lib/documentAssistant';
import { AppLocale, DocumentAnalysisEntry, DocumentAnalysisType } from '@/lib/types';

interface DocumentActionPanelProps {
  className?: string;
  locale?: AppLocale;
  analyses: DocumentAnalysisEntry[];
  onSaveAnalysis: (entry: DocumentAnalysisEntry) => void;
}

interface DocumentAssistantResponse {
  output: string;
  error?: string;
}

const KR_DOC_LABELS: Record<DocumentAnalysisType, string> = {
  'iep-notes': 'IEP 메모',
  'evaluation-report': '평가 보고서',
  'insurance-denial': '보험 거부 서신',
  'school-email': '학교 이메일',
  'provider-intake': '기관 접수 안내',
};

const KR_DOC_DESCRIPTIONS: Record<DocumentAnalysisType, string> = {
  'iep-notes': '회의 메모, 제안 목표, 특수교육 업데이트',
  'evaluation-report': '검사 요약, 평가 결과, 진단 보고서',
  'insurance-denial': '보험 거부 서신, 승인 문제, 이의신청 답변',
  'school-email': '다음 행동이 필요한 교사, 상담사, 교육청 이메일',
  'provider-intake': '기관 안내, 대기 메시지, 접수 요건',
};

export default function DocumentActionPanel({
  className = 'mt-6',
  locale,
  analyses,
  onSaveAnalysis,
}: DocumentActionPanelProps) {
  const isKorean = locale === 'ko-KR';

  const [selectedType, setSelectedType] = useState<DocumentAnalysisType>('school-email');
  const [title, setTitle] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const selectedOption = useMemo(
    () => DOCUMENT_ANALYSIS_OPTIONS.find((option) => option.type === selectedType) ?? DOCUMENT_ANALYSIS_OPTIONS[0],
    [selectedType]
  );

  const recentAnalyses = analyses.slice(0, 3);

  const handleAnalyze = async () => {
    const trimmedText = sourceText.trim();
    if (!trimmedText) {
      setError(isKorean ? '분석할 텍스트를 붙여넣어 주세요.' : 'Paste the text you want analyzed.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSaved(false);

    try {
      const response = await fetch('/api/document-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: selectedType,
          title,
          sourceText: trimmedText,
        }),
      });

      const payload = (await response.json()) as DocumentAssistantResponse;
      if (!response.ok) {
        setError(payload.error ?? (isKorean ? '서류 분석기가 이 텍스트를 처리하지 못했습니다.' : 'The document analyzer could not process this text.'));
        setOutput('');
        return;
      }

      setOutput(payload.output);
    } catch {
      setError(isKorean ? '서류 분석기가 이 텍스트를 처리하지 못했습니다.' : 'The document analyzer could not process this text.');
      setOutput('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    const trimmedOutput = output.trim();
    const trimmedText = sourceText.trim();

    if (!trimmedOutput || !trimmedText) {
      return;
    }

    onSaveAnalysis({
      id: `analysis-${Date.now()}`,
      type: selectedType,
      title: title.trim() || getDocumentAnalysisLabel(selectedType),
      sourceText: trimmedText,
      output: trimmedOutput,
      analyzedAt: new Date().toISOString(),
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const handleCopy = async () => {
    if (!output) {
      return;
    }

    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={`${className} rounded-[30px] border border-[#ddd3bf] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,244,236,0.98))] px-5 py-5 shadow-[0_22px_58px_-46px_rgba(54,44,28,0.55)] sm:px-6`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ddd3bf] bg-white/80 px-3 py-1 text-xs uppercase tracking-[0.22em] text-[#6d6658] font-body">
            <FileText size={13} className="text-[#7a724b]" />
            {isKorean ? '서류를 행동으로' : 'Document to actions'}
          </div>
          <h3 className="mt-4 font-heading text-[2rem] leading-tight text-text-main">
            {isKorean ? '서류를 다음 세 가지 행동으로 바꿔보세요.' : 'Turn paperwork into the next three moves.'}
          </h3>
          <p className="mt-3 max-w-2xl text-sm text-[#625e53] font-body leading-relaxed">
            {isKorean
              ? 'IEP 메모, 평가 보고서, 거부 서신, 학교 이메일, 기관 접수 안내 등의 텍스트를 붙여넣으세요. 직접 해석하지 않아도 되도록 구조화된 행동 요약으로 변환해드립니다.'
              : 'Paste the text from an IEP note, evaluation, denial letter, school email, or provider intake message. The app will convert it into a structured action summary instead of leaving the user to decode it manually.'}
          </p>
        </div>
        <p className="max-w-sm text-xs text-[#8a8377] font-body leading-relaxed xl:text-right">
          {isKorean
            ? '텍스트 방식을 선택한 이유가 있습니다. 복사한 이메일, 포털 내용, 보고서 발췌문에서 바로 유용한 결과를 얻을 수 있습니다.'
            : 'This is text-first on purpose. It avoids fake upload support and gets useful results from copied emails, portals, and report excerpts immediately.'}
        </p>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[24px] border border-[#e6dccb] bg-white/88 px-4 py-4">
          <div className="grid gap-3 md:grid-cols-[0.9fr_1.1fr]">
            <div>
              <label
                htmlFor="document-type"
                className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body"
              >
                {isKorean ? '서류 유형' : 'Document type'}
              </label>
              <select
                id="document-type"
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value as DocumentAnalysisType)}
                className="mt-2 w-full rounded-[18px] border border-[#ddd3bf] bg-[#fffdf8] px-4 py-3 text-sm text-text-main font-body outline-none transition-all focus:border-[#7f7a57] focus:ring-2 focus:ring-[#7f7a57]/15"
              >
                {DOCUMENT_ANALYSIS_OPTIONS.map((option) => (
                  <option key={option.type} value={option.type}>
                    {isKorean ? KR_DOC_LABELS[option.type] : option.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-[#8a8377] font-body">
                {isKorean ? KR_DOC_DESCRIPTIONS[selectedOption.type] : selectedOption.description}
              </p>
            </div>

            <div>
              <label
                htmlFor="document-title"
                className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body"
              >
                {isKorean ? '제목 (선택)' : 'Optional label'}
              </label>
              <input
                id="document-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={isKorean ? '예: 3월 31일 학교 이메일' : 'Example: School email from March 31'}
                className="mt-2 w-full rounded-[18px] border border-[#ddd3bf] bg-[#fffdf8] px-4 py-3 text-sm text-text-main font-body outline-none transition-all focus:border-[#7f7a57] focus:ring-2 focus:ring-[#7f7a57]/15"
              />
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="document-text"
              className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body"
            >
              {isKorean ? '서류 텍스트 붙여넣기' : 'Paste document text'}
            </label>
            <textarea
              id="document-text"
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              placeholder={isKorean
                ? '이메일, 보고서 발췌, 회의 메모, 거부 서신 텍스트를 여기에 붙여넣으세요.'
                : 'Paste the text of the email, report excerpt, meeting notes, or denial letter here.'}
              className="mt-2 min-h-[220px] w-full resize-y rounded-[18px] border border-[#ddd3bf] bg-[#fffdf8] px-4 py-3 text-sm text-text-main font-body outline-none transition-all placeholder:text-[#9b9487] focus:border-[#7f7a57] focus:ring-2 focus:ring-[#7f7a57]/15"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-full bg-[#6d6b47] px-4 py-2.5 text-sm text-white font-body transition-colors hover:bg-[#5a583a] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {isLoading ? (isKorean ? '분석 중' : 'Analyzing') : (isKorean ? '서류 분석' : 'Analyze document')}
            </button>
            {output && (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 rounded-full border border-[#d5cfaf] bg-[#f8f3e6] px-4 py-2.5 text-sm text-[#5a5549] font-body transition-colors hover:border-[#7f7a57] hover:text-[#504b40]"
                >
                  <Save size={14} />
                  {saved ? (isKorean ? '저장됨' : 'Saved') : (isKorean ? '분석 저장' : 'Save analysis')}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 rounded-full border border-[#ddd3bf] bg-white px-4 py-2.5 text-sm text-[#5a5549] font-body transition-colors hover:border-[#7f7a57] hover:text-[#504b40]"
                >
                  <Copy size={14} />
                  {copied ? (isKorean ? '복사됨' : 'Copied') : (isKorean ? '결과 복사' : 'Copy result')}
                </button>
              </>
            )}
          </div>

          {error && (
            <p className="mt-3 text-sm text-[#a25547] font-body">
              {error}
            </p>
          )}
        </div>

        <div className="grid gap-4">
          <div className="rounded-[24px] border border-[#e6dccb] bg-white/88 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
              {isKorean ? '분석 결과' : 'Analysis result'}
            </p>
            {output ? (
              <pre className="mt-3 whitespace-pre-wrap text-sm text-[#4f4b42] font-body leading-relaxed">
                {output}
              </pre>
            ) : (
              <p className="mt-3 text-sm text-[#8a8377] font-body">
                {isKorean ? '분석 후 구조화된 결과가 여기에 표시됩니다.' : 'The structured output will appear here after analysis.'}
              </p>
            )}
          </div>

          <div className="rounded-[24px] border border-[#e6dccb] bg-white/88 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
              {isKorean ? '최근 저장된 분석' : 'Recent saved analyses'}
            </p>
            {recentAnalyses.length > 0 ? (
              <div className="mt-3 space-y-3">
                {recentAnalyses.map((analysis) => (
                  <button
                    key={analysis.id}
                    type="button"
                    onClick={() => {
                      setSelectedType(analysis.type);
                      setTitle(analysis.title);
                      setSourceText(analysis.sourceText);
                      setOutput(analysis.output);
                      setError('');
                    }}
                    className="w-full rounded-[18px] border border-[#ece3d4] bg-[#fffdf8] px-4 py-3 text-left transition-colors hover:border-[#d5cfaf]"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
                      {isKorean ? KR_DOC_LABELS[analysis.type] : getDocumentAnalysisLabel(analysis.type)}
                    </p>
                    <h4 className="mt-2 text-sm text-text-main font-body">
                      {analysis.title}
                    </h4>
                    <p className="mt-1 text-xs text-[#8a8377] font-body">
                      {isKorean
                        ? `${new Date(analysis.analyzedAt).toLocaleString()}에 저장됨`
                        : `Saved ${new Date(analysis.analyzedAt).toLocaleString()}`}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[#8a8377] font-body">
                {isKorean ? '저장된 서류 분석이 없습니다.' : 'No document analyses saved yet.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
