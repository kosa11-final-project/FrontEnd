import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getJson, postJson, unwrapApiResponse } = vi.hoisted(() => ({
  getJson: vi.fn(),
  postJson: vi.fn(),
  unwrapApiResponse: (response) =>
    response && typeof response === 'object' && response.data !== undefined ? response.data : response,
}));
vi.mock('@/shared/api', () => ({ getJson, postJson, unwrapApiResponse }));

import { getInventorySync, retryAfterSeconds, startInventorySync } from './inventorySyncApi.js';

describe('inventorySyncApi', () => {
  beforeEach(() => {
    getJson.mockReset();
    postJson.mockReset();
  });

  it('uses the durable sync endpoints and unwraps ApiResponse data', async () => {
    postJson.mockResolvedValueOnce({ data: { syncRunId: 10, status: 'QUEUED' } });
    getJson.mockResolvedValueOnce({ data: { syncRunId: 10, status: 'RUNNING' } });

    await expect(startInventorySync('client-1')).resolves.toEqual({ syncRunId: 10, status: 'QUEUED' });
    await expect(getInventorySync(10)).resolves.toEqual({ syncRunId: 10, status: 'RUNNING' });
    expect(postJson).toHaveBeenCalledWith({
      path: 'v1/inventory-sync-runs',
      body: { clientRequestId: 'client-1' },
      signal: undefined,
    });
    expect(getJson).toHaveBeenCalledWith({ path: 'v1/inventory-sync-runs/10', signal: undefined });
  });

  it('maps Retry-After and uses a safe static fallback', () => {
    expect(retryAfterSeconds({ response: { headers: { 'retry-after': '17' } } })).toBe(17);
    expect(retryAfterSeconds({})).toBe(10);
  });
});
