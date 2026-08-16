import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Warning } from 'reicon-react';
import { formatQuantity } from '@/shared/lib/format';
import { Button, Card, Icon } from '@/shared/ui';

function QualityItem({ label, value, description }) {
  return (
    <div className="rounded-[var(--radius-control)] bg-[var(--card)] px-3 py-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[length:var(--font-size-body-sm)] font-[var(--font-weight-semibold)] text-[color:var(--text-heading)]">
          {label}
        </span>
        <strong className="shrink-0 text-[length:var(--font-size-body)] text-[color:var(--danger)]">
          {formatQuantity(value)}
        </strong>
      </div>
      <p className="mt-1 text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">{description}</p>
    </div>
  );
}

export function StatisticsDataQualityNotice({ summary, unassessedInventoryUrl }) {
  const [expanded, setExpanded] = useState(false);
  const quality = summary.dataQuality ?? {};
  const issues = [
    {
      key: 'unassessed',
      label: '위험등급 미산정',
      value: quality.unassessedSkuCount ?? 0,
      description: '위험 SKU·위험재고 집계에서 제외',
    },
    {
      key: 'forecast',
      label: '수요예측 없음',
      value: quality.missingForecastSkuCount ?? 0,
      description: '향후 30일 예상 폐기 계산에서 제외',
    },
  ].filter(({ value }) => value > 0);

  if (issues.length === 0) {
    return (
      <Card asChild padding="md" className="border-[var(--good)] bg-[var(--good-soft)]">
        <section aria-label="집계 데이터 상태" role="status" className="flex items-center gap-3">
          <Icon icon={CheckCircle} size={18} className="text-[color:var(--good)]" aria-hidden="true" />
          <div>
            <strong className="text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
              모든 데이터가 정상적으로 집계되었습니다.
            </strong>
            <p className="mt-1 text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
              선택한 범위에서 미산정되거나 계산에서 제외된 데이터가 없습니다.
            </p>
          </div>
        </section>
      </Card>
    );
  }

  return (
    <Card asChild padding="md" className="border-[var(--warning)] bg-[var(--warning-soft)]">
      <section aria-labelledby="statistics-data-quality-title" role="status">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Icon icon={Warning} size={18} className="mt-0.5 shrink-0 text-[color:var(--warning)]" aria-hidden="true" />
            <div>
              <h2
                id="statistics-data-quality-title"
                className="m-0 text-[length:var(--font-size-body)] font-[var(--font-weight-bold)] text-[color:var(--text-heading)]"
              >
                일부 데이터가 집계에서 제외되었습니다.
              </h2>
              <p className="mt-1 text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">
                위험등급 미산정 {formatQuantity(quality.unassessedSkuCount ?? 0)} · 수요예측 없음{' '}
                {formatQuantity(quality.missingForecastSkuCount ?? 0)}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {unassessedInventoryUrl ? (
              <Button asChild size="sm" variant="secondary">
                <Link to={unassessedInventoryUrl}>
                  미산정 재고 보기
                  <Icon icon={ArrowRight} size={14} aria-hidden="true" />
                </Link>
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-expanded={expanded}
              aria-controls="statistics-data-quality-details"
              onClick={() => setExpanded((current) => !current)}
            >
              {expanded ? '접기' : '자세히 보기'}
              <Icon
                icon={ArrowRight}
                size={14}
                className={`transition-transform ${expanded ? '-rotate-90' : 'rotate-90'}`}
                aria-hidden="true"
              />
            </Button>
          </div>
        </div>

        {expanded ? (
          <div id="statistics-data-quality-details" className="mt-4 grid gap-2 sm:grid-cols-2">
            {issues.map((issue) => (
              <QualityItem key={issue.key} {...issue} />
            ))}
          </div>
        ) : null}
      </section>
    </Card>
  );
}
