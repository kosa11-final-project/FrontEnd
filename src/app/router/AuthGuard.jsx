import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { currentUserQueryOptions } from '@/entities/auth';
import { StateView } from '@/shared/ui';

/**
 * 하위 업무 라우트에 진입하기 전에 백엔드 세션의 현재 사용자를 확인함
 * 브라우저 저장소의 로그인 표시가 아니라 HttpOnly JSESSIONID와 /auth/me 응답을 인증 기준으로 사용함
 */
export default function AuthGuard() {
  const location = useLocation();
  const currentUserQuery = useQuery(currentUserQueryOptions());

  // /me 확인이 끝나기 전에 보호 화면이 잠깐 노출되는 것을 방지함
  if (currentUserQuery.isPending) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--background)] px-6">
        <StateView
          state="loading"
          title="로그인 상태를 확인하고 있습니다."
          description="잠시만 기다려 주세요."
          className="w-full max-w-md"
        />
      </main>
    );
  }

  if (currentUserQuery.isError) {
    // 403은 권한 부족 화면으로 구분하고 서버 오류는 재시도 기능을 제공함
    const isForbidden = currentUserQuery.error?.status === 403;
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--background)] px-6">
        <StateView
          state={isForbidden ? 'forbidden' : 'error'}
          title={isForbidden ? undefined : '로그인 상태를 확인하지 못했습니다.'}
          description={isForbidden ? undefined : '서버 연결을 확인한 뒤 다시 시도해 주세요.'}
          actionLabel={isForbidden ? undefined : '다시 시도'}
          onAction={isForbidden ? undefined : () => currentUserQuery.refetch()}
          className="w-full max-w-md"
        />
      </main>
    );
  }

  if (!currentUserQuery.data) {
    // 로그인 성공 후 원래 요청한 pathname/search/hash로 돌아갈 수 있도록 위치를 보존함
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return <Outlet />;
}
