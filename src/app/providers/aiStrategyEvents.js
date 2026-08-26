import { notificationKeys } from '@/entities/notification';
import { aiStrategyKeys } from '@/entities/strategy';
import { env } from '@/shared/config/env.js';

export const AI_STRATEGY_EVENT_NAMES = Object.freeze({
  connected: 'connected',
  progress: 'strategy-generation-progress',
  completed: 'strategy-generation-completed',
  failed: 'strategy-generation-failed',
});

export class RecentEventIds {
  constructor(limit = 100) {
    this.limit = limit;
    this.values = new Set();
  }

  has(eventId) {
    return this.values.has(eventId);
  }

  add(eventId) {
    if (!eventId || this.values.has(eventId)) return;
    this.values.add(eventId);
    if (this.values.size <= this.limit) return;
    this.values.delete(this.values.values().next().value);
  }
}

function parseEventData(event) {
  try {
    const data = JSON.parse(event.data);
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null;
  }
}

function invalidateCaseQueries(queryClient, strategyCaseId) {
  void queryClient.invalidateQueries({ queryKey: aiStrategyKeys.lists(), refetchType: 'active' });
  if (strategyCaseId != null) {
    void queryClient.invalidateQueries({
      queryKey: aiStrategyKeys.detail(strategyCaseId),
      exact: true,
      refetchType: 'active',
    });
  }
}

function invalidateNotifications(queryClient) {
  void queryClient.invalidateQueries({ queryKey: notificationKeys.list(), refetchType: 'active' });
  void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(), refetchType: 'active' });
}

function createTransientNotification(data, failed) {
  const caseName = data.caseName || 'AI 전략';
  return {
    eventId: data.eventId,
    notificationType: failed ? 'AI_STRATEGY_GENERATION_FAILED' : 'AI_STRATEGY_GENERATION_COMPLETED',
    severity: failed ? 'ERROR' : 'INFO',
    title: failed ? 'AI 전략 생성 실패' : 'AI 전략 생성 완료',
    message: `'${caseName}' 생성${failed ? '에 실패' : '이 완료'}되었습니다.`,
    strategyCaseId: data.strategyCaseId,
  };
}

export function createAiStrategyEventHandlers({ queryClient, recentEventIds = new RecentEventIds() }) {
  function handleConnected() {
    void queryClient.invalidateQueries({ queryKey: aiStrategyKeys.lists(), refetchType: 'active' });
    void queryClient.invalidateQueries({ queryKey: aiStrategyKeys.details(), refetchType: 'active' });
    invalidateNotifications(queryClient);
  }

  function handleProgress(event) {
    const data = parseEventData(event);
    if (!data) return;
    invalidateCaseQueries(queryClient, data.strategyCaseId);
  }

  function handleTerminal(event, failed) {
    const data = parseEventData(event);
    if (!data) return;

    invalidateCaseQueries(queryClient, data.strategyCaseId);
    invalidateNotifications(queryClient);

    if (!data.eventId || recentEventIds.has(data.eventId)) return;
    recentEventIds.add(data.eventId);
    queryClient.setQueryData(notificationKeys.transient(), createTransientNotification(data, failed));
  }

  return {
    [AI_STRATEGY_EVENT_NAMES.connected]: handleConnected,
    [AI_STRATEGY_EVENT_NAMES.progress]: handleProgress,
    [AI_STRATEGY_EVENT_NAMES.completed]: (event) => handleTerminal(event, false),
    [AI_STRATEGY_EVENT_NAMES.failed]: (event) => handleTerminal(event, true),
  };
}

export function subscribeAiStrategyEvents({ queryClient, EventSourceImpl = globalThis.EventSource }) {
  if (typeof EventSourceImpl !== 'function') return () => {};

  const source = new EventSourceImpl(`${env.apiBaseUrl}v1/ai-strategies/events`, {
    withCredentials: true,
  });
  const handlers = createAiStrategyEventHandlers({ queryClient });

  Object.entries(handlers).forEach(([eventName, handler]) => {
    source.addEventListener(eventName, handler);
  });

  return () => {
    Object.entries(handlers).forEach(([eventName, handler]) => {
      source.removeEventListener(eventName, handler);
    });
    source.close();
  };
}
