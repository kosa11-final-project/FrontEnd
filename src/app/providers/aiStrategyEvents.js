import { notificationKeys } from '@/entities/notification';
import { aiStrategyKeys } from '@/entities/strategy';
import { verifyCurrentSession } from '@/entities/auth';
import { env } from '@/shared/config/env.js';

const SESSION_VERIFICATION_INTERVAL_MS = 10_000;

export const AI_STRATEGY_EVENT_NAMES = Object.freeze({
  connected: 'connected',
  progress: 'strategy-generation-progress',
  completed: 'strategy-generation-completed',
  failed: 'strategy-generation-failed',
  connectionReplaced: 'sse-connection-replaced',
});

/** 현재 페이지의 SSE 구독만 식별하는 개인정보 없는 UUID를 생성함 */
export function createSseClientId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const value = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

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

export function subscribeAiStrategyEvents({
  queryClient,
  EventSourceImpl = globalThis.EventSource,
  clientIdFactory = createSseClientId,
  verifyCurrentSessionFn = verifyCurrentSession,
  now = Date.now,
}) {
  if (typeof EventSourceImpl !== 'function') return () => {};

  const clientId = clientIdFactory();
  const source = new EventSourceImpl(
    `${env.apiBaseUrl}v1/ai-strategies/events?clientId=${encodeURIComponent(clientId)}`,
    {
      withCredentials: true,
    },
  );
  const businessHandlers = createAiStrategyEventHandlers({ queryClient });
  const verificationController = new AbortController();
  let closed = false;
  let lastSessionVerificationAt = Number.NEGATIVE_INFINITY;
  let sessionVerificationPromise = null;
  let handlers;

  function closeSubscription() {
    if (closed) return;
    closed = true;

    Object.entries(handlers).forEach(([eventName, handler]) => {
      source.removeEventListener(eventName, handler);
    });
    verificationController.abort();
    source.close();
  }

  function handleError() {
    if (closed || sessionVerificationPromise) return;

    const verificationStartedAt = now();
    if (verificationStartedAt - lastSessionVerificationAt < SESSION_VERIFICATION_INTERVAL_MS) return;
    lastSessionVerificationAt = verificationStartedAt;

    sessionVerificationPromise = Promise.resolve()
      .then(() => verifyCurrentSessionFn(verificationController.signal))
      .catch(() => {
        // AUTH-001은 공통 HTTP 계층이 처리하고, 네트워크·5xx는 자동 재연결에 맡깁니다.
      })
      .finally(() => {
        sessionVerificationPromise = null;
      });
  }

  handlers = {
    ...Object.fromEntries(
      Object.entries(businessHandlers).map(([eventName, handler]) => [
        eventName,
        (...args) => {
          if (!closed) handler(...args);
        },
      ]),
    ),
    [AI_STRATEGY_EVENT_NAMES.connectionReplaced]: closeSubscription,
    error: handleError,
  };

  Object.entries(handlers).forEach(([eventName, handler]) => {
    source.addEventListener(eventName, handler);
  });

  return closeSubscription;
}
