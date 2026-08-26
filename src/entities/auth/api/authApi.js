import { getJson, postJson } from '@/shared/api';
import { clearCsrfCredentials, rememberCsrfCredentials } from '@/shared/api/csrf.js';
import { mapAuthUser } from '../model/authUserMapper.js';

const authPath = 'v1/auth';

/**
 * 백엔드의 GET /api/v1/auth/csrf를 호출해 XSRF-TOKEN 쿠키를 발급받음
 *
 * 로그인처럼 세션 상태를 바꾸는 요청 전에 호출해야 하며, 이후 POST 요청에서는
 * 공통 Axios 인터셉터가 쿠키 값을 X-XSRF-TOKEN 헤더로 복사함
 */
export async function getCsrfToken(signal) {
  const response = await getJson({
    path: `${authPath}/csrf`,
    signal,
    skipSessionExpirationHandling: true,
  });
  const credentials = rememberCsrfCredentials(response.data);
  if (!credentials) {
    throw new Error('CSRF 토큰을 발급받지 못했습니다.');
  }
  return credentials;
}

/**
 * 백엔드 JSON 로그인 필터가 요구하는 loginId/password로 세션 로그인을 수행함
 *
 * 성공 시 백엔드가 JSESSIONID를 설정하고 ApiResponse<AuthUserResponse>를 반환함
 */
export async function login(credentials, signal) {
  // 백엔드 SecurityConfiguration에서 로그인 POST에 CSRF 검증을 적용함
  const csrf = await getCsrfToken(signal);

  const response = await postJson({
    path: `${authPath}/login`,
    body: credentials,
    headers: { [csrf.headerName]: csrf.token },
    signal,
    skipSessionExpirationHandling: true,
  });

  // 로그인 과정에서 세션 고정 방지 전략이 CSRF 토큰도 교체하므로,
  // 로그인 이후 업무 API가 사용할 토큰을 다시 발급받아 메모리에 반영함
  await getCsrfToken(signal);

  return mapAuthUser(response.data);
}

/** 서버 세션과 JSESSIONID·XSRF-TOKEN 쿠키를 제거함 */
export async function logout(signal) {
  const csrf = await getCsrfToken(signal);
  await postJson({
    path: `${authPath}/logout`,
    headers: { [csrf.headerName]: csrf.token },
    signal,
  });
  clearCsrfCredentials();
}

/** JSESSIONID에 연결된 현재 사용자를 GET /api/v1/auth/me에서 조회함 */
export async function getCurrentUser(signal) {
  const response = await getJson({
    path: `${authPath}/me`,
    signal,
    skipSessionExpirationHandling: true,
  });
  return mapAuthUser(response.data);
}
