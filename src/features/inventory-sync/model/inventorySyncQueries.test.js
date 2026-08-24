import { describe, expect, it } from 'vitest';
import {
  ACTIVE_POLL_INTERVAL_MS,
  POLL_INTERVAL_BY_STATUS_MS,
  inventorySyncKeys,
  inventorySyncLatestQueryOptions,
  inventorySyncPollInterval,
  inventorySyncRunQueryOptions,
} from './inventorySyncQueries.js';

describe('inventorySyncQueries', () => {
  it('polls only active runs and keeps a dedicated cache namespace', () => {
    const options = inventorySyncRunQueryOptions(10);
    expect(inventorySyncKeys.run(10)).toEqual(['inventory-sync', 'run', 10]);
    expect(options.queryKey).toEqual(['inventory-sync', 'run', 10]);
    expect(options.refetchInterval({ state: { data: { status: 'QUEUED' } } })).toBe(POLL_INTERVAL_BY_STATUS_MS.QUEUED);
    expect(options.refetchInterval({ state: { data: { status: 'RUNNING' } } })).toBe(
      POLL_INTERVAL_BY_STATUS_MS.RUNNING,
    );
    expect(options.refetchInterval({ state: { status: 'error', data: { status: 'RUNNING' } } })).toBe(false);
    expect(options.refetchInterval({ state: { data: { status: 'INTERRUPTED' } } })).toBe(false);
    expect(options.refetchInterval({ state: { data: { status: 'SUCCEEDED' } } })).toBe(false);
    expect(options.refetchOnWindowFocus).toBe('always');
    expect(options.refetchOnReconnect).toBe('always');
  });

  it('does not poll the global latest state while idle and resumes only for active statuses', () => {
    const options = inventorySyncLatestQueryOptions();

    expect(options.refetchInterval({ state: { data: null } })).toBe(false);
    expect(options.refetchInterval({ state: { data: { status: 'SUCCEEDED' } } })).toBe(false);
    expect(options.refetchInterval({ state: { data: { status: 'QUEUED' } } })).toBe(POLL_INTERVAL_BY_STATUS_MS.QUEUED);
    expect(options.refetchInterval({ state: { data: { status: 'RUNNING' } } })).toBe(ACTIVE_POLL_INTERVAL_MS);
    expect(options.refetchOnWindowFocus).toBe('always');
    expect(options.refetchOnReconnect).toBe('always');
    expect(options.refetchIntervalInBackground).toBe(false);
  });

  it('returns false for missing, terminal, or failed query state', () => {
    expect(inventorySyncPollInterval()).toBe(false);
    expect(inventorySyncPollInterval({ state: { status: 'error' } })).toBe(false);
  });
});
