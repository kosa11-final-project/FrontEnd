import * as Sentry from '@sentry/react';
import { env } from '@/shared/config/env.js';

export function initSentry() {
  if (!env.sentryDsn) return false;

  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.appEnvironment,
    release: env.appVersion,
    tracesSampleRate: env.sentryTracesSampleRate,
    beforeSend(event) {
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      return event;
    },
  });

  return true;
}

export { Sentry };
