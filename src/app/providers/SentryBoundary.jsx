import { Sentry } from '@/shared/monitoring/sentry.js';

export function SentryBoundary({ children }) {
  return (
    <Sentry.ErrorBoundary
      fallback={(
        <main className="grid min-h-screen place-items-center bg-[var(--background)] px-6 text-center text-[var(--foreground)]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--primary)]">APPLICATION ERROR</p>
            <h1 className="mt-2 text-2xl font-bold">화면을 불러오지 못했습니다</h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">잠시 후 다시 시도해 주세요.</p>
          </div>
        </main>
      )}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
