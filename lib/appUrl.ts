function normalizeBaseUrl(value: string | undefined | null) {
  return value?.trim().replace(/\/+$/, '') ?? '';
}

export function getCanonicalAppUrl() {
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL);
}

export function buildAppUrl(path: string, fallbackOrigin?: string) {
  const baseUrl = getCanonicalAppUrl() || normalizeBaseUrl(fallbackOrigin);

  if (!baseUrl) {
    return path;
  }

  return new URL(path, `${baseUrl}/`).toString();
}
