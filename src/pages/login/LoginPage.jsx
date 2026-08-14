import { Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { currentUserQueryOptions } from '@/entities/auth';
import { LoginForm } from '@/features/auth-login';
import { Alert, StateView } from '@/shared/ui';

const defaultAuthenticatedPath = '/dashboard';

/** AuthGuard가 보존한 최초 요청 주소를 안전하게 복원함 */
function getReturnPath(locationState) {
  const from = locationState?.from;
  if (!from?.pathname || from.pathname === '/login') return defaultAuthenticatedPath;
  return `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`;
}

export default function LoginPage() {
  const location = useLocation();
  const isSessionExpired = location.state?.authReason === 'session-expired';
  // 이미 유효한 JSESSIONID가 있는 사용자가 로그인 폼을 다시 보지 않도록 /me를 확인함
  const currentUserQuery = useQuery(currentUserQueryOptions());

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

  if (currentUserQuery.data) {
    // 로그인 성공으로 캐시가 갱신되거나 기존 세션이 확인되면 원래 목적지로 이동함
    return <Navigate replace to={getReturnPath(location.state)} />;
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

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] px-6 py-10">
      <section className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="grid size-11 place-items-center rounded-[var(--radius-card)] bg-[var(--primary-soft)] text-base font-bold text-[color:var(--primary-strong)]">
            H
          </span>
          <div>
            <strong className="block text-base text-[color:var(--text-heading)]">현대그린푸드</strong>
            <span className="text-xs text-[color:var(--text-muted)]">재고 운영 플랫폼</span>
          </div>
        </div>

        <div className="rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-panel)] sm:p-8">
          <div className="mb-8 text-center">
            <h1 className="text-[length:var(--font-size-headline1)] font-[var(--font-weight-bold)] text-[color:var(--text-heading)]">
              로그인
            </h1>
            <p className="mt-2 text-[length:var(--font-size-body)] text-[color:var(--text-muted)]">
              업무 계정으로 재고 운영 플랫폼에 접속해 주세요.
            </p>
          </div>

          {isSessionExpired ? (
            <Alert className="mb-6" variant="danger" title="로그인 세션이 만료되었습니다.">
              계속하려면 다시 로그인해 주세요.
            </Alert>
          ) : null}

          <LoginForm />
        </div>

        <p className="mt-5 text-center text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">
          계정 접근에 문제가 있다면 시스템 관리자에게 문의해 주세요.
        </p>
      </section>
    </main>
  );
}
