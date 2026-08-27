import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notificationKeys } from '@/entities/notification';
import { aiStrategyKeys } from '@/entities/strategy';
import {
  AI_STRATEGY_EVENT_NAMES,
  RecentEventIds,
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
  it('opens a credentialed EventSource, registers named events, and closes cleanly', () => {
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
    }

    const cleanup = subscribeAiStrategyEvents({
      queryClient: { invalidateQueries: vi.fn() },
      EventSourceImpl: FakeEventSource,
    });
    const source = FakeEventSource.instances[0];

    expect(source.url).toBe('/api/v1/ai-strategies/events');
    expect(source.options).toEqual({ withCredentials: true });
    expect([...source.listeners.keys()]).toEqual(Object.values(AI_STRATEGY_EVENT_NAMES));

    cleanup();

    expect(source.listeners.size).toBe(0);
    expect(source.close).toHaveBeenCalledOnce();
  });
});
