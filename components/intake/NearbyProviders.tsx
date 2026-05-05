'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, LoaderCircle, MapPin, Phone, Star } from 'lucide-react';
import {
  buildFallbackProviderSearchUrl,
  getProviderSearchConfig,
  getProviderSearchKindForAction,
} from '@/lib/providerSearchConfig';
import { AppLocale, ProviderSearchKind, ProviderSearchPayload, ProviderSearchResult } from '@/lib/types';

interface NearbyProvidersProps {
  actionId: string;
  zip: string;
  locale: AppLocale;
}

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

interface ProviderErrorState {
  code?: string;
  message: string;
}

const KOREAN_HEADINGS: Record<ProviderSearchKind, { heading: string; searchLabel: string }> = {
  speech: { heading: '근처 언어치료 기관', searchLabel: '언어치료' },
  ot: { heading: '근처 작업치료 기관', searchLabel: '작업치료' },
  aba: { heading: '근처 행동치료 기관', searchLabel: '행동치료·발달클리닉' },
  doctor: { heading: '근처 발달전문의 기관', searchLabel: '소아발달클리닉·소아정신건강의학과' },
};

function formatDistance(distanceMiles: number | null) {
  if (distanceMiles === null) {
    return null;
  }

  if (distanceMiles < 1) {
    return 'Under 1 mile';
  }

  return `${distanceMiles.toFixed(1)} miles away`;
}

function renderRating(provider: ProviderSearchResult, isKorean: boolean) {
  if (provider.rating === null) {
    return isKorean ? null : (
      <span className="text-xs text-[#8a8377] font-body">No public rating yet</span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-[#625e53] font-body">
      <Star size={12} className="fill-amber-400 text-amber-400" />
      {provider.rating.toFixed(1)} ({provider.userRatingCount}{isKorean ? '개 리뷰' : ' reviews'})
    </span>
  );
}

export default function NearbyProviders({ actionId, zip, locale }: NearbyProvidersProps) {
  const kind = getProviderSearchKindForAction(actionId);
  const [status, setStatus] = useState<LoadState>('idle');
  const [payload, setPayload] = useState<ProviderSearchPayload | null>(null);
  const [error, setError] = useState<ProviderErrorState | null>(null);
  const [showAll, setShowAll] = useState(false);

  const isKorean = locale === 'ko-KR';

  useEffect(() => {
    if (!kind || !zip) {
      return;
    }

    const providerKind = kind;
    const controller = new AbortController();

    async function loadProviders() {
      setStatus('loading');
      setError(null);

      try {
        const params = isKorean
          ? new URLSearchParams({ kind: providerKind, location: zip })
          : new URLSearchParams({ kind: providerKind, zip });
        const endpoint = isKorean ? '/api/korean-providers' : '/api/providers';

        const response = await fetch(`${endpoint}?${params.toString()}`, {
          cache: 'no-store',
          signal: controller.signal,
        });

        const body = (await response.json()) as
          | ProviderSearchPayload
          | { error?: string; code?: string };

        if (!response.ok) {
          setPayload(null);
          setError({
            code: 'code' in body ? body.code : undefined,
            message:
              'error' in body && body.error
                ? body.error
                : isKorean
                  ? '검색 서비스를 일시적으로 사용할 수 없습니다.'
                  : 'Provider search is temporarily unavailable.',
          });
          setStatus('error');
          return;
        }

        setPayload(body as ProviderSearchPayload);
        setStatus('ready');
      } catch (caughtError) {
        if (controller.signal.aborted) {
          return;
        }

        setPayload(null);
        setError({
          message:
            caughtError instanceof Error
              ? caughtError.message
              : isKorean
                ? '검색 서비스를 일시적으로 사용할 수 없습니다.'
                : 'Provider search is temporarily unavailable.',
        });
        setStatus('error');
      }
    }

    loadProviders();

    return () => controller.abort();
  }, [kind, locale, zip, isKorean]);

  useEffect(() => {
    setShowAll(false);
  }, [kind, zip]);

  if (!kind) {
    return null;
  }

  const config = getProviderSearchConfig(kind);
  const koreanConfig = KOREAN_HEADINGS[kind];
  const fallbackUrl = buildFallbackProviderSearchUrl(kind, zip, locale);
  const heading = isKorean ? koreanConfig.heading : config.heading;
  const searchLabel = isKorean ? koreanConfig.searchLabel : config.searchLabel;
  const providers = payload?.providers ?? [];
  const visibleProviders = showAll ? providers : providers.slice(0, 5);
  const hasMore = providers.length > 5;

  return (
    <div className="mt-5 rounded-[24px] border border-[#e5dccb] bg-[#fbf8f1] px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#8a8377] font-body mb-1">
            {isKorean ? '근처 기관' : 'Nearby options'}
          </p>
          <h4 className="font-heading text-base text-text-main">{heading}</h4>
          <p className="text-sm text-[#625e53] font-body leading-relaxed mt-1">
            {isKorean
              ? `${zip} 주변 ${searchLabel} 검색 결과입니다.`
              : `Public listings for ${searchLabel} near ZIP ${zip}.`}
          </p>
        </div>
        <a
          href={fallbackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline underline-offset-2 font-body flex-shrink-0"
        >
          <ExternalLink size={11} />
          {isKorean ? '네이버 지도에서 검색' : 'Search near me'}
        </a>
      </div>

      {status === 'loading' && (
        <div className="mt-4 flex items-center gap-2 text-sm text-[#625e53] font-body">
          <LoaderCircle size={14} className="animate-spin" />
          {isKorean ? '주변 기관을 검색하고 있습니다...' : 'Looking up nearby providers...'}
        </div>
      )}

      {status === 'error' && (
        <div className="mt-4 rounded-[20px] border border-amber-100 bg-white px-3 py-3">
          <p className="text-sm text-[#625e53] font-body leading-relaxed">
            {error?.code === 'missing_api_key'
              ? isKorean
                ? '검색 서비스가 아직 구성되지 않았습니다.'
                : 'Nearby provider listings are not configured yet in this deployment.'
              : error?.message ??
                (isKorean
                  ? '검색 서비스를 일시적으로 사용할 수 없습니다.'
                  : 'Provider search is temporarily unavailable.')}
          </p>
        </div>
      )}

      {status === 'ready' && providers.length === 0 && (
        <div className="mt-4 rounded-[20px] border border-[#e5dccb] bg-white px-3 py-3">
          <p className="text-sm text-[#625e53] font-body leading-relaxed">
            {isKorean
              ? '검색 결과가 없습니다. 위의 지도 검색 링크를 이용해 보세요.'
              : 'No strong matches were returned for this ZIP yet. Use the map search above to broaden the search.'}
          </p>
        </div>
      )}

      {providers.length > 0 && (
        <div className="mt-4 space-y-3">
          {visibleProviders.map((provider) => {
            const distanceLabel = isKorean ? null : formatDistance(provider.distanceMiles);

            return (
              <div
                key={provider.id}
                className="rounded-[20px] border border-[#e5dccb] bg-white px-3 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <a
                      href={provider.googleMapsUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-text-main hover:text-primary transition-colors font-body"
                    >
                      <ExternalLink size={12} />
                      {provider.name}
                    </a>
                    {provider.primaryType && (
                      <p className="text-xs text-[#8a8377] font-body mt-1">{provider.primaryType}</p>
                    )}
                  </div>
                  {renderRating(provider, isKorean)}
                </div>

                <div className="mt-2 space-y-1.5">
                  <p className="flex items-start gap-1.5 text-sm text-[#625e53] font-body leading-relaxed">
                    <MapPin size={14} className="mt-0.5 flex-shrink-0 text-[#8a8377]" />
                    <span>{provider.address}</span>
                  </p>
                  {provider.phone && (
                    <p className="flex items-center gap-1.5 text-sm text-[#625e53] font-body">
                      <Phone size={14} className="flex-shrink-0 text-[#8a8377]" />
                      <span>{provider.phone}</span>
                    </p>
                  )}
                </div>

                {distanceLabel && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#f3eee3] px-2 py-0.5 text-xs text-[#6f695d] font-body">
                      {distanceLabel}
                    </span>
                    {provider.reviewConfidence === 'limited' && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700 font-body">
                        Limited review data
                      </span>
                    )}
                    {provider.reviewConfidence === 'none' && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 font-body">
                        No review count yet
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                  <a
                    href={provider.googleMapsUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline underline-offset-2 font-body"
                  >
                    <ExternalLink size={11} />
                    {isKorean ? '네이버 지도에서 보기' : 'View on Google Maps'}
                  </a>
                  {provider.websiteUri && (
                    <a
                      href={provider.websiteUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline underline-offset-2 font-body"
                    >
                      <ExternalLink size={11} />
                      {isKorean ? '웹사이트 방문' : 'Visit website'}
                    </a>
                  )}
                </div>

                {provider.attributions.length > 0 && (
                  <p className="mt-3 text-[11px] text-[#8a8377] font-body leading-relaxed">
                    Additional data providers:{' '}
                    {provider.attributions.map((attribution, index) => (
                      <span key={attribution.url}>
                        {index > 0 ? ', ' : ''}
                        <a
                          href={attribution.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors"
                        >
                          {attribution.label}
                        </a>
                      </span>
                    ))}
                  </p>
                )}
              </div>
            );
          })}

          {hasMore && (
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              className="text-sm text-primary hover:underline underline-offset-2 font-body"
            >
              {showAll
                ? isKorean ? '간략히 보기' : 'Show fewer providers'
                : isKorean
                  ? `전체 ${providers.length}개 보기`
                  : `Show ${providers.length} providers`}
            </button>
          )}
        </div>
      )}

      <p className="mt-4 text-[11px] text-[#8a8377] font-body leading-relaxed">
        {isKorean ? (
          <>
            <span translate="no">네이버 지도</span> 데이터. {payload?.rankingSummary ?? '예약 가능 여부와 비용은 기관에 직접 확인하세요.'}
          </>
        ) : (
          <>
            <span translate="no">Google Maps</span> data. {payload?.rankingSummary ?? 'Public ratings can be incomplete, so verify fit and credentials directly.'}
          </>
        )}
      </p>
    </div>
  );
}
