'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { AppLocale } from '@/lib/types';
import { LOCALE_LABELS, writeStoredLocale } from '@/lib/locale';

const LOCALES: AppLocale[] = ['en-US', 'ko-KR'];

export default function LocaleStartCard() {
  return (
    <div className="mt-8 w-full rounded-[28px] border border-[#e6dccb] bg-white/90 px-5 py-5 shadow-[0_20px_60px_-48px_rgba(54,44,28,0.55)]">
      <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body">
        Choose your guide
      </p>
      <div className="mt-4 grid gap-3">
        {LOCALES.map((locale) => {
          const label = LOCALE_LABELS[locale];

          return (
            <Link
              key={locale}
              href={`/intake?locale=${locale}`}
              onClick={() => writeStoredLocale(locale)}
              className="group flex items-center justify-between gap-4 rounded-[22px] border border-[#ddd3bf] bg-[#fffdf8] px-4 py-4 text-left transition-colors hover:border-[#7f7a57] hover:bg-white"
            >
              <span>
                <span className="block text-sm font-medium text-text-main font-body">
                  {label.title}
                </span>
                <span className="mt-1 block text-xs text-[#6f695d] font-body leading-relaxed">
                  {label.subtitle}
                </span>
              </span>
              <ArrowRight
                size={18}
                className="shrink-0 text-[#8a8377] transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
