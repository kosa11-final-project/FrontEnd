import { axiosClient } from './clients/axiosClient.js';

const methods = new Set(['get', 'post', 'put', 'patch', 'delete', 'head']);

export const defaultHttpClient = axiosClient;

/**
 * Domain API modules use this adapter instead of importing Axios directly.
 * Keeping this boundary small prevents pages and features from coupling to
 * the HTTP library or its response shape.
 */
export async function requestJson({ method = 'get', path, params, body, headers, signal }) {
  const normalizedMethod = method.toLowerCase();
  if (!methods.has(normalizedMethod)) {
    throw new Error(`지원하지 않는 HTTP 메서드입니다: ${method}`);
  }

  const response = await axiosClient.request({
    method: normalizedMethod,
    url: path,
    params,
    data: body,
    headers,
    signal,
  });

  return response.status === 204 ? undefined : response.data;
}
