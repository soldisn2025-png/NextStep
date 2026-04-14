import { NextRequest, NextResponse } from 'next/server';
import { searchProvidersByZip, ProviderSearchError } from '@/lib/providerSearch';
import { ProviderSearchKind } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const VALID_PROVIDER_KINDS: ProviderSearchKind[] = ['speech', 'ot', 'aba'];

function isProviderKind(value: string | null): value is ProviderSearchKind {
  return Boolean(value && VALID_PROVIDER_KINDS.includes(value as ProviderSearchKind));
}
  if (!/^\d{5}$/.test(zip)) {
    return NextResponse.json(
      { error: 'A valid 5-digit ZIP code is required.' },
      { status: 400 }
    );
  }


export async function GET(request: NextRequest) {
  const zip = request.nextUrl.searchParams.get('zip') ?? '';
  const kind = request.nextUrl.searchParams.get('kind');

  if (!isProviderKind(kind)) {
    return NextResponse.json(
      { error: 'A valid provider kind is required.' },
      { status: 400 }
    );
  }

  try {
    const payload = await searchProvidersByZip(kind, zip);
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    if (error instanceof ProviderSearchError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Provider search is temporarily unavailable.', code: 'provider_search_failed' },
      { status: 500 }
    );
  }
}
