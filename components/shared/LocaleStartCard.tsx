'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { AppLocale } from '@/lib/types';
import { LOCALE_LABELS, writeStoredLocale } from '@/lib/locale';

const LOCALES: AppLocale[] = ['en-US', 'ko-KR'];

export default function LocaleStartCard() {
  return (
    <div className="mt-8 w-full rounded-2xl border border-gray-200 bg-white px-2 py-2 shadow-sm">
      <div className="grid gap-1">
        {LOCALES.map((locale) => {
          const label = LOCALE_LABELS[locale];

          return (
            <Link
              key={locale}
              href={`/intake?locale=${locale}`}
              onClick={() => writeStoredLocale(locale)}
              className="group flex items-center justify-between gap-4 rounded-xl bg-gray-50 px-4 py-4 text-left transition-colors hover:bg-primary/5"
            >
              <span>
                <span className="block text-sm font-semibold text-text-main font-body">
                  {label.title}
                </span>
                <span className="mt-1 block text-xs text-gray-500 font-body leading-relaxed">
                  {label.subtitle}
                </span>
              </span>
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                <ArrowRight size={14} className="text-white" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
