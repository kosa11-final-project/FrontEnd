import { Building, Calendar, Layers, Store } from 'reicon-react';
import { formatDate } from '@/shared/lib/format';
import { Button, Card, Icon, SelectMenu } from '@/shared/ui';
import { STATISTICS_PERIODS, STATISTICS_SCOPES } from '../model/statisticsModel.js';
import { StatisticsDateRangePicker } from './StatisticsDateRangePicker.jsx';

const SCOPE_META = Object.freeze({
  NATIONAL: { icon: Layers, description: '전체 재고 거점 통합' },
  WAREHOUSE: { icon: Building, description: '판매처 미할당 재고' },
  OFFLINE_STORE: { icon: Store, description: '오프라인 판매처 재고' },
  ONLINE_STORE: { icon: Store, description: '온라인 판매처 재고' },
});

export function StatisticsFilters({
  period,
  range,
  scopeType,
  locationId,
  locationOptions,
  maxDate,
  onPeriodChange,
  onCustomRangeChange,
  onScopeTypeChange,
  onLocationChange,
}) {
  return (
    <Card asChild padding="md" className="shadow-[var(--shadow-soft)]">
      <section aria-label="운영 통계 조회 조건" className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {STATISTICS_PERIODS.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={period === option.value ? 'primary' : 'secondary'}
                aria-pressed={period === option.value}
                onClick={() => onPeriodChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {period === 'CUSTOM' ? (
            <div className="mt-3">
              <StatisticsDateRangePicker range={range} maxDate={maxDate} onChange={onCustomRangeChange} />
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">
              <Icon icon={Calendar} size={16} aria-hidden="true" />
              <strong className="text-[color:var(--text-heading)]">
                {formatDate(range.from)} ~ {formatDate(range.to)}
              </strong>
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
          <label className="grid gap-1.5 text-[length:var(--font-size-meta)] font-[var(--font-weight-semibold)] text-[color:var(--text-body)]">
            통계 범위
            <SelectMenu
              value={scopeType}
              aria-label="통계 범위"
              onValueChange={onScopeTypeChange}
              options={STATISTICS_SCOPES.map((scope) => ({
                ...scope,
                ...SCOPE_META[scope.value],
              }))}
              contentClassName="min-w-[240px]"
            />
          </label>

          <label className="grid gap-1.5 text-[length:var(--font-size-meta)] font-[var(--font-weight-semibold)] text-[color:var(--text-body)]">
            세부 위치
            <SelectMenu
              value={locationId}
              aria-label="세부 위치"
              disabled={scopeType === 'NATIONAL' || scopeType === 'UNASSIGNED'}
              onValueChange={onLocationChange}
              options={[
                {
                  value: 'ALL',
                  label: '전체 위치',
                  icon: SCOPE_META[scopeType]?.icon ?? Layers,
                  description: '선택 범위의 모든 재고',
                },
                ...locationOptions.map((location) => ({
                  value: location.id,
                  label: location.name,
                  icon: SCOPE_META[scopeType]?.icon ?? Building,
                  description: location.region ? `${location.region} · 개별 위치` : '개별 위치',
                })),
              ]}
              contentClassName="min-w-[260px]"
            />
          </label>
        </div>
      </section>
    </Card>
  );
}
