const runtimeEnv = import.meta.env;

const withTrailingSlash = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized) return '/api/';
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
};

export const env = Object.freeze({
  apiBaseUrl: withTrailingSlash(runtimeEnv.VITE_API_BASE_URL),
  csrfCookieName: runtimeEnv.VITE_CSRF_COOKIE_NAME || 'XSRF-TOKEN',
  csrfHeaderName: runtimeEnv.VITE_CSRF_HEADER_NAME || 'X-XSRF-TOKEN',
  requestTimeoutMs: Number(runtimeEnv.VITE_API_TIMEOUT_MS) || 10_000,
  inventoryRequestTimeoutMs: Number(runtimeEnv.VITE_INVENTORY_API_TIMEOUT_MS) || 30_000,
  sentryDsn: runtimeEnv.VITE_SENTRY_DSN || '',
  appEnvironment: runtimeEnv.VITE_APP_ENVIRONMENT || runtimeEnv.MODE || 'development',
  appVersion: runtimeEnv.VITE_APP_VERSION || 'local',
  sentryTracesSampleRate: Number(runtimeEnv.VITE_SENTRY_TRACES_SAMPLE_RATE) || 0,
});
