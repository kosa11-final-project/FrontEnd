import { env } from '../config/env.js';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);

export function isSafeMethod(method = 'GET') {
  return safeMethods.has(method.toUpperCase());
}

export function getCsrfToken() {
  if (typeof document === 'undefined') return null;

  const token = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${env.csrfCookieName}=`))
    ?.split('=')
    .slice(1)
    .join('=');

  return token ? decodeURIComponent(token) : null;
}

export function getCsrfHeader(method) {
  if (isSafeMethod(method)) return null;

  const token = getCsrfToken();
  return token ? { name: env.csrfHeaderName, value: token } : null;
}
