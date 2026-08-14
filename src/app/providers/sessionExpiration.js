import { authKeys } from '@/entities/auth';

function getReturnLocation(location) {
  return {
    pathname: location.pathname,
    search: location.search ?? '',
    hash: location.hash ?? '',
  };
}

/** 동시에 발생한 세션 만료를 하나의 캐시 정리와 로그인 이동으로 합침 */
export function createSessionExpirationHandler({ queryClient, router }) {
  let handlingPromise = null;

  return function handleSessionExpiration() {
    if (handlingPromise) return handlingPromise;
    if (router.state.location.pathname === '/login') return Promise.resolve();

    const from = getReturnLocation(router.state.location);

    handlingPromise = (async () => {
      await queryClient.cancelQueries();
      queryClient.clear();
      queryClient.setQueryData(authKeys.currentUser(), null);
      await router.navigate('/login', {
        replace: true,
        state: { from, authReason: 'session-expired' },
      });
    })().finally(() => {
      handlingPromise = null;
    });

    return handlingPromise;
  };
}
