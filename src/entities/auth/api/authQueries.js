import { queryOptions } from '@tanstack/react-query';
import { getCsrfToken, getCurrentUser } from './authApi.js';

// 인증 상태 캐시를 일관된 키로 참조하기 위한 Query Key Factory
export const authKeys = Object.freeze({
  all: ['auth'],
  currentUser: () => [...authKeys.all, 'current-user'],
});

/** 백엔드가 세션 없음·만료·로그인 실패에 공통으로 사용하는 AUTH-001인지 확인함 */
export function isAuthenticationError(error) {
  return error?.status === 401 || error?.code === 'AUTH-001';
}

/**
 * 세션이 없는 상태는 화면에서 처리할 정상 상태(null)로 변환함
 * 서버 장애나 권한 오류까지 숨기지 않고 AuthGuard/LoginPage의 오류 화면으로 전달함
 */
export async function resolveCurrentUser(signal) {
  try {
    // Prime the in-memory CSRF token for subsequent state-changing requests.
    // This is required when the API lives on a different subdomain and its
    // host-only XSRF-TOKEN cookie is not readable by the frontend.
    await getCsrfToken(signal);
    return await getCurrentUser(signal);
  } catch (error) {
    if (isAuthenticationError(error)) return null;
    throw error;
  }
}

/** 진행 중인 세션 조회를 취소한 뒤 로그인 사용자를 캐시에 기록함 */
export async function cacheAuthenticatedUser(queryClient, user) {
  await queryClient.cancelQueries({ queryKey: authKeys.currentUser(), exact: true });
  queryClient.setQueryData(authKeys.currentUser(), user);
}

/** 현재 사용자 서버 상태를 모든 로그인 화면과 보호 라우트가 공유하는 Query 설정 */
export function currentUserQueryOptions() {
  return queryOptions({
    queryKey: authKeys.currentUser(),
    queryFn: ({ signal }) => resolveCurrentUser(signal),
    // 라우트 이동 때마다 /me를 중복 호출하지 않되 세션 변경은 비교적 빠르게 재확인함
    staleTime: 30_000,
    // 인증 실패는 재시도하지 않고, 일시적인 서버 오류만 한 번 재시도함
    retry: (failureCount, error) => error?.status >= 500 && failureCount < 1,
  });
}
