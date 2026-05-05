import { NextRequest, NextResponse } from 'next/server';
import { ProviderSearchKind, ProviderSearchPayload, ProviderSearchResult } from '@/lib/types';
import { providerRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const VALID_KINDS: ProviderSearchKind[] = ['speech', 'ot', 'aba', 'doctor'];

const KOREAN_QUERIES: Record<ProviderSearchKind, string> = {
  speech: '언어치료',
  ot: '작업치료',
  aba: '행동치료 발달클리닉',
  doctor: '소아발달클리닉',
};

interface NaverLocalItem {
  title: string;
  link: string;
  category: string;
  description: string;
  telephone: string;
  address: string;
  roadAddress: string;
  mapx: string;
  mapy: string;
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]+>/g, '');
}

export async function GET(request: NextRequest) {
  const ip =
    request.ip ??
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    '127.0.0.1';

  const { success } = await providerRateLimit.limit(ip);
  if (!success) {
    return NextResponse.json({ error: '요청이 너무 많습니다.' }, { status: 429 });
  }

  const rawKind = request.nextUrl.searchParams.get('kind');
  const location = request.nextUrl.searchParams.get('location') ?? '';

  if (!rawKind || !VALID_KINDS.includes(rawKind as ProviderSearchKind)) {
    return NextResponse.json({ error: '유효한 검색 유형이 필요합니다.' }, { status: 400 });
  }

  const kind = rawKind as ProviderSearchKind;

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: '검색 서비스가 구성되지 않았습니다.', code: 'missing_api_key' },
      { status: 503 }
    );
  }

  const searchQuery = location
    ? `${KOREAN_QUERIES[kind]} ${location}`
    : KOREAN_QUERIES[kind];

  const params = new URLSearchParams({ query: searchQuery, display: '5' });
  const url = `https://openapi.naver.com/v1/search/local.json?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: '네이버 검색 서비스에 문제가 발생했습니다.' },
        { status: 502 }
      );
    }

    const data = (await response.json()) as { items?: NaverLocalItem[] };
    const items: NaverLocalItem[] = data.items ?? [];

    const providers: ProviderSearchResult[] = items.map((item, index) => {
      const name = stripHtml(item.title);
      const address = item.roadAddress || item.address;
      const naverMapsUri = `https://map.naver.com/p/search/${encodeURIComponent(`${name} ${address}`.trim())}`;

      return {
        id: `naver-${index}-${item.mapx}-${item.mapy}`,
        kind,
        name,
        address,
        phone: item.telephone || null,
        websiteUri: item.link || null,
        googleMapsUri: naverMapsUri,
        rating: null,
        userRatingCount: 0,
        distanceMiles: null,
        reviewConfidence: 'none' as const,
        primaryType: item.category || null,
        score: 0,
        attributions: [],
      };
    });

    const payload: ProviderSearchPayload = {
      kind,
      providers,
      sourceLabel: '네이버 지도',
      rankingSummary:
        '네이버 지도 검색 결과입니다. 예약 가능 여부와 비용은 기관에 직접 확인하세요.',
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(payload, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: '검색 서비스를 일시적으로 사용할 수 없습니다.' },
      { status: 500 }
    );
  }
}
