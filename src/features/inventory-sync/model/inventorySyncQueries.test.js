import { describe, expect, it } from 'vitest';
import {
  ACTIVE_POLL_INTERVAL_MS,
  inventorySyncKeys,
  inventorySyncLatestQueryOptions,
  inventorySyncRunQueryOptions,
} from './inventorySyncQueries.js';

describe('inventorySyncQueries', () => {
  it('polls only active runs and keeps a dedicated cache namespace', () => {
    const options = inventorySyncRunQueryOptions(10);
    expect(inventorySyncKeys.run(10)).toEqual(['inventory-sync', 'run', 10]);
    expect(options.queryKey).toEqual(['inventory-sync', 'run', 10]);
    expect(options.refetchInterval({ state: { data: { status: 'RUNNING' } } })).toBe(ACTIVE_POLL_INTERVAL_MS);
    expect(options.refetchInterval({ state: { data: { status: 'INTERRUPTED' } } })).toBe(false);
    expect(options.refetchInterval({ state: { data: { status: 'SUCCEEDED' } } })).toBe(false);
  });

  it('checks the lightweight global latest state while idle so every session sees a new active run', () => {
    const options = inventorySyncLatestQueryOptions();

    expect(options.refetchInterval).toBe(ACTIVE_POLL_INTERVAL_MS);
    expect(options.refetchIntervalInBackground).toBe(false);
  });
});
