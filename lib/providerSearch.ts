import { ProviderSearchKind, ProviderSearchPayload, ProviderSearchResult } from './types';
import { getProviderSearchConfig } from './providerSearchConfig';

const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const US_REGION_CODE = 'US';
const LOCATION_BIAS_RADIUS_METERS = 25000;
const MAX_PROVIDER_RESULTS = 10;
const REVIEW_PRIOR_MEAN = 4;
const REVIEW_PRIOR_WEIGHT = 10;

type ProviderSearchErrorCode =
  | 'invalid_zip'
  | 'missing_api_key'
  | 'geocoding_failed'
  | 'provider_search_failed';

export class ProviderSearchError extends Error {
  constructor(
    message: string,
    readonly code: ProviderSearchErrorCode,
    readonly statusCode: number
  ) {
    super(message);
    this.name = 'ProviderSearchError';
  }
}

interface ZipGeocode {
  latitude: number;
  longitude: number;
}

interface GeocodeResponse {
  status: string;
  error_message?: string;
  results: Array<{
    geometry?: {
      location?: {
        lat?: number;
        lng?: number;
      };
    };
  }>;
}

interface GoogleAttribution {
  provider?: string;
  providerUri?: string;
}

interface GooglePlace {
  id?: string;
  displayName?: {
    text?: string;
  };
  formattedAddress?: string;
  googleMapsUri?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  primaryTypeDisplayName?: {
    text?: string;
  };
  location?: {
    latitude?: number;
    longitude?: number;
  };
  attributions?: GoogleAttribution[];
}

interface TextSearchResponse {
  places?: GooglePlace[];
  error?: {
    message?: string;
  };
}

function normalizeZip(zip: string) {
  return zip.replace(/\D/g, '').slice(0, 5);
}

function getApiKey() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new ProviderSearchError(
      'Google Maps provider search is not configured.',
      'missing_api_key',
      503
    );
  }

  return apiKey;
}

async function geocodeZip(zip: string, apiKey: string): Promise<ZipGeocode> {
  const normalizedZip = normalizeZip(zip);

  if (normalizedZip.length !== 5) {
    throw new ProviderSearchError('A valid 5-digit ZIP code is required.', 'invalid_zip', 400);
  }

  const params = new URLSearchParams({
    components: `postal_code:${normalizedZip}|country:${US_REGION_CODE}`,
    key: apiKey,
    language: 'en',
    region: 'us',
  });

  const response = await fetch(`${GEOCODE_URL}?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new ProviderSearchError(
      `ZIP geocoding failed with status ${response.status}.`,
      'geocoding_failed',
      502
    );
  }

  const payload = (await response.json()) as GeocodeResponse;
  const location = payload.results[0]?.geometry?.location;

  if (
    payload.status !== 'OK' ||
    location?.lat === undefined ||
    location?.lng === undefined
  ) {
    throw new ProviderSearchError(
      payload.error_message ?? 'Unable to geocode the requested ZIP code.',
      'geocoding_failed',
      502
    );
  }

  return {
    latitude: location.lat,
    longitude: location.lng,
  };
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function calculateDistanceMiles(
  start: ZipGeocode,
  end: { latitude?: number; longitude?: number } | undefined
) {
  if (end?.latitude === undefined || end?.longitude === undefined) {
    return null;
  }

  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(end.latitude - start.latitude);
  const dLng = toRadians(end.longitude - start.longitude);
  const lat1 = toRadians(start.latitude);
  const lat2 = toRadians(end.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(a));
}

function getKeywordBoost(kind: ProviderSearchKind, place: GooglePlace) {
  const config = getProviderSearchConfig(kind);
  const haystack = [
    place.displayName?.text ?? '',
    place.formattedAddress ?? '',
    place.primaryTypeDisplayName?.text ?? '',
  ]
    .join(' ')
    .toLowerCase();

  return config.fitKeywords.reduce((boost, keyword) => {
    return haystack.includes(keyword) ? boost + 1.5 : boost;
  }, 0);
}

function getReviewConfidence(reviewCount: number): ProviderSearchResult['reviewConfidence'] {
  if (reviewCount >= 20) {
    return 'strong';
  }

  if (reviewCount > 0) {
    return 'limited';
  }

  return 'none';
}

function scorePlace(kind: ProviderSearchKind, place: GooglePlace, center: ZipGeocode) {
  const rating = place.rating ?? 0;
  const reviewCount = place.userRatingCount ?? 0;
  const distanceMiles = calculateDistanceMiles(center, place.location);
  const adjustedRating =
    ((rating * reviewCount) + REVIEW_PRIOR_MEAN * REVIEW_PRIOR_WEIGHT) /
    (reviewCount + REVIEW_PRIOR_WEIGHT);
  const ratingScore = adjustedRating * 20;
  const reviewVolumeScore = Math.min(12, Math.log10(reviewCount + 1) * 6);
  const distanceScore =
    distanceMiles === null ? 0 : Math.max(0, 18 - Math.min(distanceMiles, 30) * 0.6);
  const keywordBoost = getKeywordBoost(kind, place);

  return {
    distanceMiles,
    score: ratingScore + reviewVolumeScore + distanceScore + keywordBoost,
  };
}

function transformPlace(
  kind: ProviderSearchKind,
  place: GooglePlace,
  center: ZipGeocode
): ProviderSearchResult | null {
  if (!place.id || !place.displayName?.text || !place.formattedAddress || !place.googleMapsUri) {
    return null;
  }

  const { distanceMiles, score } = scorePlace(kind, place, center);
  const reviewCount = place.userRatingCount ?? 0;

  return {
    id: place.id,
    kind,
    name: place.displayName.text,
    address: place.formattedAddress,
    phone: place.nationalPhoneNumber ?? null,
    websiteUri: place.websiteUri ?? null,
    googleMapsUri: place.googleMapsUri,
    rating: place.rating ?? null,
    userRatingCount: reviewCount,
    distanceMiles,
    reviewConfidence: getReviewConfidence(reviewCount),
    primaryType: place.primaryTypeDisplayName?.text ?? null,
    score,
    attributions:
      place.attributions
        ?.filter((attribution) => attribution.provider && attribution.providerUri)
        .map((attribution) => ({
          label: attribution.provider as string,
          url: attribution.providerUri as string,
        })) ?? [],
  };
}

async function fetchProviders(
  kind: ProviderSearchKind,
  center: ZipGeocode,
  apiKey: string
): Promise<ProviderSearchResult[]> {
  const config = getProviderSearchConfig(kind);
  const response = await fetch(TEXT_SEARCH_URL, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.googleMapsUri',
        'places.websiteUri',
        'places.nationalPhoneNumber',
        'places.rating',
        'places.userRatingCount',
        'places.primaryTypeDisplayName',
        'places.location',
        'places.attributions',
      ].join(','),
    },
    body: JSON.stringify({
      textQuery: config.textQuery,
      maxResultCount: MAX_PROVIDER_RESULTS,
      languageCode: 'en',
      regionCode: US_REGION_CODE,
      rankPreference: 'RELEVANCE',
      includePureServiceAreaBusinesses: false,
      locationBias: {
        circle: {
          center: {
            latitude: center.latitude,
            longitude: center.longitude,
          },
          radius: LOCATION_BIAS_RADIUS_METERS,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new ProviderSearchError(
      `Provider lookup failed with status ${response.status}.`,
      'provider_search_failed',
      502
    );
  }

  const payload = (await response.json()) as TextSearchResponse;

  if (payload.error) {
    throw new ProviderSearchError(
      payload.error.message ?? 'Google Places returned an unexpected error.',
      'provider_search_failed',
      502
    );
  }

  return (payload.places ?? [])
    .map((place) => transformPlace(kind, place, center))
    .filter((provider): provider is ProviderSearchResult => Boolean(provider))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      if (b.userRatingCount !== a.userRatingCount) {
        return b.userRatingCount - a.userRatingCount;
      }

      if (a.distanceMiles === null || b.distanceMiles === null) {
        return 0;
      }

      return a.distanceMiles - b.distanceMiles;
    });
}

export async function searchProvidersByZip(
  kind: ProviderSearchKind,
  zip: string
): Promise<ProviderSearchPayload> {
  const apiKey = getApiKey();
  const center = await geocodeZip(zip, apiKey);
  const providers = await fetchProviders(kind, center, apiKey);

  return {
    kind,
    providers,
    sourceLabel: 'Google Maps',
    rankingSummary:
      'Sorted using public Google Maps ratings, review count, distance, and query fit. This is not an endorsement.',
    generatedAt: new Date().toISOString(),
  };
}
