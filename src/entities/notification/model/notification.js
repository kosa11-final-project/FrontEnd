export const AI_STRATEGY_NOTIFICATION_TYPES = Object.freeze([
  'AI_STRATEGY_GENERATION_COMPLETED',
  'AI_STRATEGY_GENERATION_FAILED',
]);

export function isFailureNotification(notification) {
  return notification?.severity === 'ERROR' || notification?.notificationType?.endsWith('_FAILED');
}

export function getNotificationTarget(notification) {
  if (Number.isInteger(notification?.strategyCaseId)) {
    if (isFailureNotification(notification)) {
      const strategyCaseId = encodeURIComponent(notification.strategyCaseId);
      return `/ai-strategy?q=${strategyCaseId}&drawer=${strategyCaseId}`;
    }
    return `/ai-strategy/${notification.strategyCaseId}`;
  }
  return null;
}
