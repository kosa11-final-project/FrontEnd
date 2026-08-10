import { beforeEach, describe, expect, it, vi } from 'vitest';

const { request } = vi.hoisted(() => ({
  request: vi.fn(),
}));

vi.mock('./clients/axiosClient.js', () => ({
  axiosClient: { request },
}));

import { deleteJson, getJson, headJson, patchJson, postJson, putJson, requestJson } from './httpClient.js';

describe('shared HTTP client helpers', () => {
  beforeEach(() => {
    request.mockReset();
    request.mockResolvedValue({ status: 200, data: { ok: true } });
  });

  it.each([
    ['get', getJson],
    ['post', postJson],
    ['put', putJson],
    ['patch', patchJson],
    ['delete', deleteJson],
    ['head', headJson],
  ])('sends the %s method through one request shape', async (method, helper) => {
    const signal = new AbortController().signal;
    const options = {
      path: 'v1/inventories/inventory-1',
      params: { source: 'test' },
      body: { availableQuantity: 10 },
      headers: { 'X-Request-Id': 'test-request' },
      signal,
    };

    await helper(options);

    expect(request).toHaveBeenCalledWith({
      method,
      url: options.path,
      params: options.params,
      data: options.body,
      headers: options.headers,
      signal,
    });
  });

  it('returns response data and maps 204 to undefined', async () => {
    await expect(requestJson({ path: 'v1/inventories' })).resolves.toEqual({ ok: true });

    request.mockResolvedValueOnce({ status: 204, data: '' });
    await expect(deleteJson({ path: 'v1/inventories/inventory-1' })).resolves.toBeUndefined();
  });

  it('rejects unsupported HTTP methods before making a request', async () => {
    await expect(requestJson({ method: 'connect', path: 'v1/inventories' })).rejects.toThrow(
      '지원하지 않는 HTTP 메서드입니다: connect',
    );
    expect(request).not.toHaveBeenCalled();
  });
});
