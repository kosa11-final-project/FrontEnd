import axios from 'axios';
import { env } from '../../config/env.js';
import { getCsrfHeader } from '../csrf.js';
import { normalizeApiError } from '../apiError.js';

export const axiosClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.requestTimeoutMs,
  withCredentials: true,
  headers: { Accept: 'application/json' },
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
  (error) => Promise.reject(normalizeApiError(error)),
);
