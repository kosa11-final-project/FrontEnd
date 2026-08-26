import { env } from '../config/env.js';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);

// The API and the frontend use different subdomains in production. In that
// setup the browser sends the XSRF-TOKEN cookie to the API, but JavaScript
// running on stockfit.win cannot read a host-only cookie for api.stockfit.win.
// Keep the token returned by /csrf in memory so the request interceptor can
// still attach it without widening the cookie's domain.
let csrfCredentials = null;

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

export function rememberCsrfCredentials(credentials) {
  if (!credentials?.token) return null;

  csrfCredentials = {
    token: credentials.token,
    headerName: credentials.headerName || env.csrfHeaderName,
  };

  return csrfCredentials;
}

export function clearCsrfCredentials() {
  csrfCredentials = null;
}

export function getCsrfHeader(method) {
  if (isSafeMethod(method)) return null;

  const token = csrfCredentials?.token || getCsrfToken();
  const name = csrfCredentials?.headerName || env.csrfHeaderName;
  return token ? { name, value: token } : null;
}
