import { ArrowRight, InfoCircle } from 'reicon-react';
import { formatCurrency, formatPercent, formatQuantity } from '@/shared/lib/format';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Icon } from '@/shared/ui';

function formatValue(item, value) {
  return item.format === 'currency' ? formatCurrency(value) : formatQuantity(value);
}

const COMPARISON_TONES = Object.freeze({
  'risk-stock': {
    color: 'var(--primary)',
    track: 'var(--primary-soft)',
    badge: 'good',
    badgeLabel: '위험재고',
    accentClass: 'border-t-[color:var(--primary)]',
    textClass: 'text-[color:var(--primary)]',
    surfaceClass: 'bg-[var(--primary-soft)]',
  },
  'disposal-risk': {
    color: 'var(--warning)',
    track: 'var(--warning-soft)',
    badge: 'warning',
    badgeLabel: '폐기위험',
    accentClass: 'border-t-[color:var(--warning)]',
    textClass: 'text-[color:var(--warning)]',
    surfaceClass: 'bg-[var(--warning-soft)]',
  },
  'estimated-loss': {
    color: 'var(--info)',
    track: 'var(--info-soft)',
    badge: 'info',
    badgeLabel: '손실비용',
    accentClass: 'border-t-[color:var(--info)]',
    textClass: 'text-[color:var(--info)]',
    surfaceClass: 'bg-[var(--info-soft)]',
  },
});

export function StrategyBeforeAfterComparison({ comparison = [], isPreview = false }) {
  return (
    <Card asChild padding="none" className="min-w-0 shadow-[var(--shadow-soft)]">
      <section aria-labelledby="strategy-before-after-title">
        <CardHeader className="border-b border-[var(--border)] p-5">
          <CardTitle id="strategy-before-after-title">종료 전략 실행 전후 종합 비교</CardTitle>
          <CardDescription className="mt-1">
            선택 기간에 종료된 모든 전략의 시작 기준 합계와 종료 기준 합계를 비교합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 p-5 md:grid-cols-3">
          {comparison.map((item) => {
            const improvementRate = item.before ? (item.reduction / item.before) * 100 : 0;
            const progress = Math.min(100, Math.max(0, improvementRate));
            const tone = COMPARISON_TONES[item.key] ?? COMPARISON_TONES['risk-stock'];

            return (
              <article
                key={item.key}
                className={`h-full rounded-[var(--radius-control)] border border-t-4 border-[var(--border)] p-4 ${tone.accentClass}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
                    {item.label}
                  </strong>
                  <Badge variant={tone.badge}>{tone.badgeLabel}</Badge>
                </div>

                <div
                  className="mx-auto mt-4 grid size-36 place-items-center rounded-full"
                  style={{
                    background: `conic-gradient(${tone.color} 0 ${progress}%, ${tone.track} ${progress}% 100%)`,
                  }}
                  role="progressbar"
                  aria-label={`${item.label} 개선율`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Number(improvementRate.toFixed(1))}
                >
                  <div className="grid size-[112px] place-items-center rounded-full bg-[var(--card)] text-center shadow-[var(--shadow-soft)]">
                    <span>
                      <span className="block text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
                        개선율
                      </span>
                      <strong className={`mt-1 block text-2xl ${tone.textClass}`}>
                        {formatPercent(improvementRate)}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
                  <div>
                    <span className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
                      전략 실행 전 합계
                    </span>
                    <strong className="mt-1 block text-[length:var(--font-size-title-sm)] text-[color:var(--text-heading)]">
                      {formatValue(item, item.before)}
                    </strong>
                  </div>
                  <Icon icon={ArrowRight} size={20} className={tone.textClass} aria-hidden="true" />
                  <div className="text-right">
                    <span className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
                      전략 종료 후 합계
                    </span>
                    <strong className={`mt-1 block text-[length:var(--font-size-title-sm)] ${tone.textClass}`}>
                      {formatValue(item, item.after)}
                    </strong>
                  </div>
                </div>
                <div className={`mt-3 rounded-[var(--radius-control)] px-3 py-2 text-right ${tone.surfaceClass}`}>
                  <span
                    className={`text-[length:var(--font-size-meta)] font-[var(--font-weight-semibold)] ${tone.textClass}`}
                  >
                    {formatValue(item, item.reduction)} 감소
                  </span>
                </div>
              </article>
            );
          })}
          {isPreview ? (
            <p className="flex items-start gap-2 text-[length:var(--font-size-meta)] text-[color:var(--text-muted)] md:col-span-3">
              <Icon icon={InfoCircle} size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
              개별 전략의 기준값을 합산한 UI 검토용 데이터입니다. 동일 재고의 중복 집계 기준은 백엔드 연동 시
              확정됩니다.
            </p>
          ) : null}
        </CardContent>
      </section>
    </Card>
  );
}
