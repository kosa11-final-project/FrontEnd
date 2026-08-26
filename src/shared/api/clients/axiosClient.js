import axios from 'axios';
import { env } from '../../config/env.js';
import { getCsrfHeader } from '../csrf.js';
import { normalizeApiError } from '../apiError.js';
import { notifySessionExpiration } from '../sessionExpiration.js';

export const axiosClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.requestTimeoutMs,
  withCredentials: true,
  headers: { Accept: 'application/json' },
  // Spring MVC의 List query parameter 바인딩(channelType=a&channelType=b)에 맞춥니다.
  paramsSerializer: { indexes: null },
});

axiosClient.interceptors.request.use((config) => {
  const csrfHeader = getCsrfHeader(config.method);
  if (csrfHeader) {
    if (typeof config.headers?.set === 'function') {
      config.headers.set(csrfHeader.name, csrfHeader.value);
    } else {
      config.headers = { ...config.headers, [csrfHeader.name]: csrfHeader.value };
    }
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }
    const normalizedError = normalizeApiError(error);
    notifySessionExpiration(normalizedError, error?.config);
    return Promise.reject(normalizedError);
  },
);
