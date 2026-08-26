import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { router } from '../router/router.jsx';
import { subscribeSessionExpiration } from '@/shared/api';
import { createSessionExpirationHandler } from './sessionExpiration.js';

/** 업무 API의 세션 만료를 사용자 캐시 정리와 로그인 이동으로 연결함 */
export function SessionExpirationHandler() {
  const queryClient = useQueryClient();
  const handleSessionExpiration = useMemo(() => createSessionExpirationHandler({ queryClient, router }), [queryClient]);

  useEffect(
    () =>
      subscribeSessionExpiration(() => {
        void handleSessionExpiration();
      }),
    [handleSessionExpiration],
  );

  return null;
}
