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
    <main className="login-page">
      <div className="login-page__frame">
        <section className="login-page__visual" aria-labelledby="stockfit-visual-title">
          <img
            className="login-page__visual-image"
            src="/assets/brand/stockfit-login-hero.jpg"
            alt="식품 매장과 재고 흐름을 추상화한 파스텔 페이퍼 콜라주"
          />
          <div className="login-page__visual-wash" aria-hidden="true" />
          <div className="login-page__visual-copy">
            <img
              className="login-page__visual-logo"
              src="/assets/brand/stockfit-sidebar-logo.png"
              alt=""
              aria-hidden="true"
            />
            <div>
              <h1 id="stockfit-visual-title">StockFit</h1>
              <p>HYUNDAI GREEN FOOD 통합 재고 관리 플랫폼</p>
            </div>
          </div>
        </section>

        <section className="login-page__form" aria-labelledby="login-title">
          <div className="login-page__form-inner">
            <div className="login-page__form-heading">
              <h2 id="login-title">로그인</h2>
              <p>업무 계정으로 StockFit에 접속해 주세요.</p>
            </div>

            {isSessionExpired ? (
              <Alert className="mb-6" variant="danger" title="로그인 세션이 만료되었습니다.">
                계속하려면 다시 로그인해 주세요.
              </Alert>
            ) : null}

            <LoginForm />

            <p className="login-page__support-copy">계정 접근에 문제가 있다면 시스템 관리자에게 문의해 주세요.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
