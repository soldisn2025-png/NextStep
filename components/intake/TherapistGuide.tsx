'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, LoaderCircle, Sparkles } from 'lucide-react';

interface TherapistGuideProps {
  actionId: string;
  childAge: string;
  diagnoses: string[];
  topConcerns: string[];
}

type GuideState = 'idle' | 'loading' | 'ready' | 'error';

export default function TherapistGuide({
  actionId,
  childAge,
  diagnoses,
  topConcerns,
}: TherapistGuideProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<GuideState>('idle');
  const [guide, setGuide] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!open || fetchedRef.current) return;
    fetchedRef.current = true;
    setStatus('loading');

    fetch('/api/therapist-guide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionId, childAge, diagnoses, topConcerns }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.guide) {
          setError(data.error ?? 'Could not load the guide right now.');
          setStatus('error');
          return;
        }
        setGuide(data.guide);
        setStatus('ready');
      })
      .catch(() => {
        setError('Could not load the guide right now.');
        setStatus('error');
      });
  }, [open, actionId, childAge, diagnoses, topConcerns]);

  return (
    <div className="mt-5 rounded-[24px] border border-[#e5dccb] bg-[#fbf8f1] px-4 py-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="flex-shrink-0 text-[#8a8377]" />
          <span className="text-sm font-medium text-text-main font-body">
            What to look for in a therapist
          </span>
        </div>
        {open
          ? <ChevronUp size={15} className="flex-shrink-0 text-[#8a8377]" />
          : <ChevronDown size={15} className="flex-shrink-0 text-[#8a8377]" />}
      </button>

      {open && (
        <div className="mt-3">
          {status === 'loading' && (
            <div className="flex items-center gap-2 text-sm text-[#625e53] font-body">
              <LoaderCircle size={14} className="animate-spin" />
              Generating your personalized guide...
            </div>
          )}
          {status === 'error' && (
            <p className="text-sm text-[#8a8377] font-body leading-relaxed">{error}</p>
          )}
          {status === 'ready' && guide && (
            <p className="text-sm text-[#3d3a34] font-body leading-relaxed whitespace-pre-line">
              {guide.replace(/\*\*/g, '').replace(/\*/g, '')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
