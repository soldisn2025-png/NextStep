import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get('lat');
  const lng = request.nextUrl.searchParams.get('lng');

  if (!lat || !lng || isNaN(Number(lat)) || isNaN(Number(lng))) {
    return NextResponse.json({ error: 'Valid lat and lng are required.' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Reverse geocoding is not configured.' }, { status: 503 });
  }

  const params = new URLSearchParams({
    latlng: `${lat},${lng}`,
    result_type: 'postal_code',
    key: apiKey,
    language: 'en',
    region: 'us',
  });

  const response = await fetch(`${GEOCODE_URL}?${params.toString()}`, { cache: 'no-store' });

  if (!response.ok) {
    return NextResponse.json({ error: 'Reverse geocoding failed.' }, { status: 502 });
  }

  const data = await response.json();

  if (data.status !== 'OK' || !data.results?.[0]) {
    return NextResponse.json({ error: 'No ZIP found for this location.' }, { status: 404 });
  }

  const postalComponent = data.results[0].address_components?.find(
    (c: { types: string[] }) => c.types.includes('postal_code')
  );

  if (!postalComponent?.short_name) {
    return NextResponse.json({ error: 'No ZIP found for this location.' }, { status: 404 });
  }

  return NextResponse.json({ zip: postalComponent.short_name }, { status: 200 });
}
