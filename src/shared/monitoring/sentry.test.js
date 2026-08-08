import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sentryInit } = vi.hoisted(() => ({ sentryInit: vi.fn() }));

vi.mock('@sentry/react', () => ({ init: sentryInit }));
vi.mock('@/shared/config/env.js', () => ({
  env: {
    sentryDsn: 'https://public@example.ingest.sentry.io/1',
    appEnvironment: 'test',
    appVersion: 'test@1.0.0',
    sentryTracesSampleRate: 0,
  },
}));

import { initSentry, scrubSentryEvent } from './sentry.js';

describe('scrubSentryEvent', () => {
  beforeEach(() => {
    sentryInit.mockClear();
  });

  it('removes identity, session, and inventory-sensitive fields', () => {
    const result = scrubSentryEvent({
      user: { id: 'internal-user', email: 'private@example.com', ip_address: '127.0.0.1' },
      request: {
        headers: { authorization: 'Bearer secret', accept: 'application/json' },
        cookies: 'JSESSIONID=secret',
      },
      extra: { sku: 'GF-001', retryCount: 1 },
    });

    expect(result.user).toEqual({ id: 'internal-user' });
    expect(result.request.headers).toEqual({ authorization: '[REDACTED]', accept: 'application/json' });
    expect(result.request.cookies).toBe('[REDACTED]');
    expect(result.extra).toEqual({ sku: '[REDACTED]', retryCount: 1 });
  });

  it('removes sensitive values embedded in messages and URL details', () => {
    const result = scrubSentryEvent({
      message: 'Authorization: Bearer secret-token',
      request: { url: 'https://example.com/inventory?sku=GF-001&token=secret#result' },
      breadcrumbs: [
        {
          message: 'GET /api/inventories?itemCode=GF-001&lot=2026-08-03',
          data: { detail: 'email=private@example.com' },
        },
      ],
      exception: { values: [{ value: 'customer private@example.com failed' }] },
    });

    expect(result.message).toBe('Authorization: [REDACTED]');
    expect(result.request.url).toBe('https://example.com/inventory');
    expect(result.breadcrumbs[0].message).toBe('GET /api/inventories');
    expect(result.breadcrumbs[0].data.detail).toBe('email=[REDACTED]');
    expect(result.exception.values[0].value).toBe('customer [REDACTED_EMAIL] failed');
  });

  it('applies the same scrubber to errors, breadcrumbs, transactions, and spans', () => {
    expect(initSentry()).toBe(true);

    expect(sentryInit).toHaveBeenCalledWith(
      expect.objectContaining({
        beforeSend: scrubSentryEvent,
        beforeBreadcrumb: scrubSentryEvent,
        beforeSendTransaction: scrubSentryEvent,
        beforeSendSpan: scrubSentryEvent,
        sendDefaultPii: false,
      }),
    );
  });
});
