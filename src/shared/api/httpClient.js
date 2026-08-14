import { axiosClient } from './clients/axiosClient.js';

const methods = new Set(['get', 'post', 'put', 'patch', 'delete', 'head']);

export const defaultHttpClient = axiosClient;

/**
 * Domain API modules use this adapter instead of importing Axios directly.
 * Keeping this boundary small prevents pages and features from coupling to
 * the HTTP library or its response shape.
 */
export async function requestJson({
  method = 'get',
  path,
  params,
  body,
  headers,
  signal,
  skipSessionExpirationHandling = false,
}) {
  const normalizedMethod = method.toLowerCase();
  if (!methods.has(normalizedMethod)) {
    throw new Error(`지원하지 않는 HTTP 메서드입니다: ${method}`);
  }

  const response = await defaultHttpClient.request({
    method: normalizedMethod,
    url: path,
    params,
    data: body,
    headers,
    signal,
    ...(skipSessionExpirationHandling ? { skipSessionExpirationHandling: true } : {}),
  });

  return response.status === 204 ? undefined : response.data;
}

function requestWithMethod(method, options = {}) {
  return requestJson({ ...options, method });
}

/**
 * Named helpers keep domain API modules from repeating method strings while
 * preserving one request shape for params, body, headers, and cancellation.
 */
export const getJson = (options = {}) => requestWithMethod('get', options);
export const postJson = (options = {}) => requestWithMethod('post', options);
export const putJson = (options = {}) => requestWithMethod('put', options);
export const patchJson = (options = {}) => requestWithMethod('patch', options);
export const deleteJson = (options = {}) => requestWithMethod('delete', options);
export const headJson = (options = {}) => requestWithMethod('head', options);
