const sessionExpirationListeners = new Set();

/** 세션 만료 이벤트 구독자를 등록하고 해당 구독의 해제 함수를 반환함 */
export function subscribeSessionExpiration(listener) {
  sessionExpirationListeners.add(listener);
  return () => sessionExpirationListeners.delete(listener);
}

/** 업무 요청의 세션 만료 응답만 등록된 구독자에게 전달함 */
export function notifySessionExpiration(error, requestConfig) {
  const shouldNotify =
    requestConfig?.skipSessionExpirationHandling !== true && error?.status === 401 && error?.code === 'AUTH-001';

  if (!shouldNotify) return;
  sessionExpirationListeners.forEach((listener) => listener(error));
}
