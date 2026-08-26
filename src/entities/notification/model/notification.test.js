import { describe, expect, it } from 'vitest';
import { getNotificationTarget, isFailureNotification } from './notification.js';

describe('notification model', () => {
  it('routes completed strategy notifications to the detail route', () => {
    expect(getNotificationTarget({ strategyCaseId: 123 })).toBe('/ai-strategy/123');
    expect(getNotificationTarget({ forecastRunId: 77 })).toBeNull();
    expect(getNotificationTarget({ notificationType: 'UNKNOWN' })).toBeNull();
  });

  it('routes failed strategy notifications to the matching list drawer', () => {
    expect(
      getNotificationTarget({
        notificationType: 'AI_STRATEGY_GENERATION_FAILED',
        severity: 'ERROR',
        strategyCaseId: 123,
      }),
    ).toBe('/ai-strategy?q=123&drawer=123');
  });

  it('recognizes error severity and failed notification types', () => {
    expect(isFailureNotification({ severity: 'ERROR' })).toBe(true);
    expect(isFailureNotification({ notificationType: 'AI_STRATEGY_GENERATION_FAILED' })).toBe(true);
    expect(isFailureNotification({ severity: 'INFO', notificationType: 'FORECAST_COMPLETED' })).toBe(false);
  });
});
