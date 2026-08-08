import * as Sentry from '@sentry/react';
import { env } from '@/shared/config/env.js';

const sensitiveKeyPattern =
  /authorization|cookie|csrf|xsrf|token|password|secret|session|email|phone|sku|lot|item.?code|stock|sales|revenue|cost/i;
const sensitiveNameSource = sensitiveKeyPattern.source;
const sensitiveAssignmentPattern = new RegExp(
  `([\\w.-]*(?:${sensitiveNameSource})[\\w.-]*\\s*[:=]\\s*)(?:Bearer\\s+)?(?:"[^"]*"|'[^']*'|[^\\s,;&]+)`,
  'gi',
);
const bearerTokenPattern = /\bBearer\s+[^\s,;&]+/gi;
const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const urlWithDetailsPattern = /((?:https?:\/\/|\/)[^\s?#]+)(?:\?[^\s#]*)?(?:#[^\s]*)?/gi;

function redactSensitiveText(value) {
  return value
    .replace(urlWithDetailsPattern, '$1')
    .replace(sensitiveAssignmentPattern, '$1[REDACTED]')
    .replace(bearerTokenPattern, 'Bearer [REDACTED]')
    .replace(emailPattern, '[REDACTED_EMAIL]');
}

function redactValue(value, seen = new WeakSet()) {
  if (typeof value === 'string') return redactSensitiveText(value);
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return '[REDACTED_CIRCULAR]';
  seen.add(value);

  if (Array.isArray(value)) return value.map((item) => redactValue(item, seen));

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      sensitiveKeyPattern.test(key) ? '[REDACTED]' : redactValue(child, seen),
    ]),
  );
}

export function scrubSentryEvent(event) {
  const scrubbed = redactValue(event);
  if (!scrubbed || typeof scrubbed !== 'object') return scrubbed;

  if (scrubbed.user) {
    delete scrubbed.user.email;
    delete scrubbed.user.ip_address;
  }

  return scrubbed;
}

export function initSentry() {
  if (!env.sentryDsn) return false;

  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.appEnvironment,
    release: env.appVersion,
    tracesSampleRate: env.sentryTracesSampleRate,
    sendDefaultPii: false,
    beforeSend: scrubSentryEvent,
    beforeBreadcrumb: scrubSentryEvent,
    beforeSendTransaction: scrubSentryEvent,
    beforeSendSpan: scrubSentryEvent,
  });

  return true;
}

export { Sentry };
