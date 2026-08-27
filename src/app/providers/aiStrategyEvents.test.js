import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notificationKeys } from '@/entities/notification';
import { aiStrategyKeys } from '@/entities/strategy';
import {
  AI_STRATEGY_EVENT_NAMES,
  RecentEventIds,
  createSseClientId,
  createAiStrategyEventHandlers,
  subscribeAiStrategyEvents,
} from './aiStrategyEvents.js';

function event(data) {
  return { data: JSON.stringify(data) };
}

function createHarness() {
  const queryClient = { invalidateQueries: vi.fn(), setQueryData: vi.fn() };
  const handlers = createAiStrategyEventHandlers({ queryClient });
  return { handlers, queryClient };
}

class FakeEventSource {
  static instances = [];

  constructor(url, options) {
    this.url = url;
    this.options = options;
    this.listeners = new Map();
    this.close = vi.fn();
    FakeEventSource.instances.push(this);
  }

  addEventListener(name, handler) {
    this.listeners.set(name, handler);
  }

  removeEventListener(name, handler) {
    if (this.listeners.get(name) === handler) this.listeners.delete(name);
  }

  emit(name, payload) {
    this.listeners.get(name)?.(payload);
  }
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, reject, resolve };
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe('AI strategy SSE event handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refreshes lists and the exact detail without a toast for progress', () => {
    const { handlers, queryClient } = createHarness();

    handlers[AI_STRATEGY_EVENT_NAMES.progress](event({ eventId: 'p-1', strategyCaseId: 123 }));

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: aiStrategyKeys.lists(),
      refetchType: 'active',
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: aiStrategyKeys.detail(123),
      exact: true,
      refetchType: 'active',
    });
    expect(queryClient.setQueryData).not.toHaveBeenCalled();
  });

  it.each([
    [AI_STRATEGY_EVENT_NAMES.completed, 'default'],
    [AI_STRATEGY_EVENT_NAMES.failed, 'destructive'],
  ])('refreshes case and notification queries and stores a transient notification for %s', (eventName, variant) => {
    const { handlers, queryClient } = createHarness();

    handlers[eventName](event({ eventId: `${eventName}-1`, strategyCaseId: 123, caseName: 'AI 전략' }));

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: notificationKeys.list(),
      refetchType: 'active',
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: notificationKeys.unreadCount(),
      refetchType: 'active',
    });
    expect(queryClient.setQueryData).toHaveBeenCalledWith(
      notificationKeys.transient(),
      expect.objectContaining({
        title: variant === 'destructive' ? 'AI 전략 생성 실패' : 'AI 전략 생성 완료',
        strategyCaseId: 123,
      }),
    );
  });

  it('stores a terminal notification only once for the same event ID', () => {
    const { handlers, queryClient } = createHarness();
    const completed = event({ eventId: 'same-id', strategyCaseId: 123, caseName: '중복 전략' });

    handlers[AI_STRATEGY_EVENT_NAMES.completed](completed);
    handlers[AI_STRATEGY_EVENT_NAMES.completed](completed);

    expect(queryClient.setQueryData).toHaveBeenCalledOnce();
  });

  it('refreshes all active AI strategy and notification data after reconnecting', () => {
    const { handlers, queryClient } = createHarness();

    handlers[AI_STRATEGY_EVENT_NAMES.connected]();

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: aiStrategyKeys.lists(),
      refetchType: 'active',
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: aiStrategyKeys.details(),
      refetchType: 'active',
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: notificationKeys.list(),
      refetchType: 'active',
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: notificationKeys.unreadCount(),
      refetchType: 'active',
    });
    expect(queryClient.setQueryData).not.toHaveBeenCalled();
  });

  it('keeps only a bounded number of recent event IDs', () => {
    const recent = new RecentEventIds(2);
    recent.add('first');
    recent.add('second');
    recent.add('third');

    expect(recent.has('first')).toBe(false);
    expect(recent.has('second')).toBe(true);
    expect(recent.has('third')).toBe(true);
  });
});

describe('AI strategy SSE subscription', () => {
  beforeEach(() => {
    FakeEventSource.instances = [];
  });

  it('opens a credentialed EventSource with a subscription-scoped UUID and closes cleanly', () => {
    const clientId = '4eb10643-596d-4271-8fd7-9b9f626fd053';
    const cleanup = subscribeAiStrategyEvents({
      queryClient: { invalidateQueries: vi.fn() },
      EventSourceImpl: FakeEventSource,
      clientIdFactory: () => clientId,
    });
    const source = FakeEventSource.instances[0];

    expect(source.url).toBe(`/api/v1/ai-strategies/events?clientId=${clientId}`);
    expect(source.options).toEqual({ withCredentials: true });
    expect([...source.listeners.keys()]).toEqual([...Object.values(AI_STRATEGY_EVENT_NAMES), 'error']);

    cleanup();

    expect(source.listeners.size).toBe(0);
    expect(source.close).toHaveBeenCalledOnce();
  });

  it('creates a new client ID only when a new subscription is mounted', () => {
    const clientIdFactory = vi
      .fn()
      .mockReturnValueOnce('11111111-1111-4111-8111-111111111111')
      .mockReturnValueOnce('22222222-2222-4222-8222-222222222222');
    const options = {
      queryClient: { invalidateQueries: vi.fn() },
      EventSourceImpl: FakeEventSource,
      clientIdFactory,
      verifyCurrentSessionFn: vi.fn().mockResolvedValue({ userId: 1 }),
    };

    const firstCleanup = subscribeAiStrategyEvents(options);
    FakeEventSource.instances[0].emit('error');
    expect(clientIdFactory).toHaveBeenCalledOnce();
    expect(FakeEventSource.instances[0].url).toContain('11111111-1111-4111-8111-111111111111');

    firstCleanup();
    subscribeAiStrategyEvents(options);

    expect(clientIdFactory).toHaveBeenCalledTimes(2);
    expect(FakeEventSource.instances[1].url).toContain('22222222-2222-4222-8222-222222222222');
  });

  it('creates an RFC 4122 UUID fallback when randomUUID is unavailable', () => {
    const originalCrypto = globalThis.crypto;
    vi.stubGlobal('crypto', {
      getRandomValues: (bytes) => {
        bytes.fill(0x12);
        return bytes;
      },
    });

    expect(createSseClientId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);

    vi.stubGlobal('crypto', originalCrypto);
  });

  it('stops the replaced connection without touching queries or notifications', () => {
    const queryClient = { invalidateQueries: vi.fn(), setQueryData: vi.fn() };
    const verifyCurrentSessionFn = vi.fn();
    const cleanup = subscribeAiStrategyEvents({
      queryClient,
      EventSourceImpl: FakeEventSource,
      clientIdFactory: () => '11111111-1111-4111-8111-111111111111',
      verifyCurrentSessionFn,
    });
    const source = FakeEventSource.instances[0];
    const replacedHandler = source.listeners.get(AI_STRATEGY_EVENT_NAMES.connectionReplaced);
    const errorHandler = source.listeners.get('error');

    replacedHandler(event({ reason: 'CONNECTION_LIMIT_EXCEEDED', maxConnections: 5 }));
    errorHandler();
    cleanup();

    expect(source.close).toHaveBeenCalledOnce();
    expect(source.listeners.size).toBe(0);
    expect(verifyCurrentSessionFn).not.toHaveBeenCalled();
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
    expect(queryClient.setQueryData).not.toHaveBeenCalled();
  });

  it('verifies the session once for repeated errors inside ten seconds', async () => {
    let currentTime = 1_000;
    const firstVerification = deferred();
    const verifyCurrentSessionFn = vi
      .fn()
      .mockReturnValueOnce(firstVerification.promise)
      .mockResolvedValueOnce({ userId: 1 });
    subscribeAiStrategyEvents({
      queryClient: { invalidateQueries: vi.fn() },
      EventSourceImpl: FakeEventSource,
      clientIdFactory: () => '11111111-1111-4111-8111-111111111111',
      verifyCurrentSessionFn,
      now: () => currentTime,
    });
    const source = FakeEventSource.instances[0];

    source.emit('error');
    source.emit('error');
    await Promise.resolve();
    expect(verifyCurrentSessionFn).toHaveBeenCalledOnce();

    currentTime += 9_999;
    source.emit('error');
    expect(verifyCurrentSessionFn).toHaveBeenCalledOnce();

    firstVerification.resolve({ userId: 1 });
    await firstVerification.promise;
    await flushMicrotasks();

    currentTime += 1;
    source.emit('error');
    await Promise.resolve();
    expect(verifyCurrentSessionFn).toHaveBeenCalledTimes(2);
    expect(source.close).not.toHaveBeenCalled();
  });

  it('does not start another verification while one is in progress', async () => {
    const pending = deferred();
    const verifyCurrentSessionFn = vi.fn().mockReturnValue(pending.promise);
    subscribeAiStrategyEvents({
      queryClient: { invalidateQueries: vi.fn() },
      EventSourceImpl: FakeEventSource,
      clientIdFactory: () => '11111111-1111-4111-8111-111111111111',
      verifyCurrentSessionFn,
      now: vi.fn().mockReturnValueOnce(0).mockReturnValueOnce(20_000),
    });
    const source = FakeEventSource.instances[0];

    source.emit('error');
    await Promise.resolve();
    expect(verifyCurrentSessionFn).toHaveBeenCalledOnce();
    source.emit('error');
    expect(verifyCurrentSessionFn).toHaveBeenCalledOnce();

    pending.resolve({ userId: 1 });
    await pending.promise;
  });

  it.each([
    ['network error', new TypeError('Network Error')],
    ['server error', { status: 503, code: 'COMMON-001' }],
    ['expired session', { status: 401, code: 'AUTH-001' }],
  ])('keeps native reconnection open after a %s verification rejection', async (_name, errorValue) => {
    const verifyCurrentSessionFn = vi.fn().mockRejectedValue(errorValue);
    subscribeAiStrategyEvents({
      queryClient: { invalidateQueries: vi.fn() },
      EventSourceImpl: FakeEventSource,
      clientIdFactory: () => '11111111-1111-4111-8111-111111111111',
      verifyCurrentSessionFn,
    });
    const source = FakeEventSource.instances[0];

    source.emit('error');
    await Promise.resolve();
    expect(verifyCurrentSessionFn).toHaveBeenCalledOnce();

    expect(source.close).not.toHaveBeenCalled();
  });

  it('aborts an in-flight verification and ignores late events after cleanup', async () => {
    const pending = deferred();
    const queryClient = { invalidateQueries: vi.fn(), setQueryData: vi.fn() };
    let verificationSignal;
    const cleanup = subscribeAiStrategyEvents({
      queryClient,
      EventSourceImpl: FakeEventSource,
      clientIdFactory: () => '11111111-1111-4111-8111-111111111111',
      verifyCurrentSessionFn: vi.fn((signal) => {
        verificationSignal = signal;
        return pending.promise;
      }),
    });
    const source = FakeEventSource.instances[0];
    const progressHandler = source.listeners.get(AI_STRATEGY_EVENT_NAMES.progress);

    source.emit('error');
    await Promise.resolve();
    expect(verificationSignal).toBeDefined();
    cleanup();
    progressHandler(event({ strategyCaseId: 123 }));
    pending.reject(new DOMException('Aborted', 'AbortError'));
    await pending.promise.catch(() => {});

    expect(verificationSignal.aborted).toBe(true);
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
    expect(source.close).toHaveBeenCalledOnce();
  });
});
