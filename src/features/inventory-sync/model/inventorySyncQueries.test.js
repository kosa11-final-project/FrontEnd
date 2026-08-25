import { describe, expect, it } from 'vitest';
import {
  POLL_INTERVAL_BY_STATUS_MS,
  SNAPSHOT_REFRESH_FAST_POLL_INTERVAL_MS,
  SNAPSHOT_REFRESH_FAST_WINDOW_MS,
  SNAPSHOT_REFRESH_MAX_WAIT_MS,
  SNAPSHOT_REFRESH_NORMAL_POLL_INTERVAL_MS,
  isSnapshotRefreshDelayed,
  isSnapshotRefreshFailed,
  inventorySyncKeys,
  inventorySyncLatestQueryOptions,
  inventorySyncPollInterval,
  inventorySyncRunQueryOptions,
  snapshotRefreshPollInterval,
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
    expect(
      options.refetchInterval(
        {
          state: {
            data: {
              status: 'SUCCEEDED',
              completedAt: '2026-08-24T00:00:00.000Z',
              snapshotRefresh: { required: true, dashboardReady: true, inventoryStatisticsReady: false },
            },
          },
        },
        Date.parse('2026-08-24T00:00:30.000Z'),
      ),
    ).toBe(SNAPSHOT_REFRESH_FAST_POLL_INTERVAL_MS);
    expect(
      options.refetchInterval({
        state: {
          data: {
            status: 'SUCCEEDED',
            snapshotRefresh: { required: true, dashboardReady: true, inventoryStatisticsReady: true },
          },
        },
      }),
    ).toBe(false);
    expect(options.refetchOnWindowFocus).toBe(false);
    expect(options.refetchOnReconnect).toBe(false);
  });

  it('never interval-polls latest because the run detail owns active tracking', () => {
    const options = inventorySyncLatestQueryOptions();

    expect(options.refetchInterval).toBe(false);
    expect(options.refetchOnWindowFocus).toBe('always');
    expect(options.refetchOnReconnect).toBe('always');
    expect(options.refetchIntervalInBackground).toBe(false);
  });

  it('returns false for missing, terminal, or failed query state', () => {
    expect(inventorySyncPollInterval()).toBe(false);
    expect(inventorySyncPollInterval({ state: { status: 'error' } })).toBe(false);
  });

  it('backs snapshot polling off and stops after the bounded wait window', () => {
    const completedAt = '2026-08-24T00:00:00.000Z';
    const run = {
      status: 'SUCCEEDED',
      completedAt,
      snapshotRefresh: { required: true, dashboardReady: false, inventoryStatisticsReady: true },
    };
    const completedAtMillis = Date.parse(completedAt);

    expect(snapshotRefreshPollInterval(run, completedAtMillis + SNAPSHOT_REFRESH_FAST_WINDOW_MS - 1)).toBe(
      SNAPSHOT_REFRESH_FAST_POLL_INTERVAL_MS,
    );
    expect(snapshotRefreshPollInterval(run, completedAtMillis + SNAPSHOT_REFRESH_FAST_WINDOW_MS)).toBe(
      SNAPSHOT_REFRESH_NORMAL_POLL_INTERVAL_MS,
    );
    expect(snapshotRefreshPollInterval(run, completedAtMillis + SNAPSHOT_REFRESH_MAX_WAIT_MS - 1)).toBe(
      SNAPSHOT_REFRESH_NORMAL_POLL_INTERVAL_MS,
    );
    expect(snapshotRefreshPollInterval(run, completedAtMillis + SNAPSHOT_REFRESH_MAX_WAIT_MS)).toBe(false);
    expect(isSnapshotRefreshDelayed(run, completedAtMillis + SNAPSHOT_REFRESH_MAX_WAIT_MS)).toBe(true);
    expect(snapshotRefreshPollInterval({ ...run, completedAt: null })).toBe(SNAPSHOT_REFRESH_NORMAL_POLL_INTERVAL_MS);
  });

  it('stops polling immediately when either durable snapshot task has failed', () => {
    const run = {
      status: 'SUCCEEDED',
      completedAt: '2026-08-24T00:00:00.000Z',
      snapshotRefresh: {
        required: true,
        dashboardReady: true,
        inventoryStatisticsReady: false,
        dashboardStatus: 'SUCCEEDED',
        inventoryStatisticsStatus: 'FAILED',
      },
    };

    expect(isSnapshotRefreshFailed(run)).toBe(true);
    expect(snapshotRefreshPollInterval(run)).toBe(false);
    expect(isSnapshotRefreshDelayed(run, Date.parse('2026-08-24T01:00:00.000Z'))).toBe(false);
  });
});
