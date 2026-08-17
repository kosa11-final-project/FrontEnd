import { Calendar } from 'reicon-react';
import { formatDate } from '@/shared/lib/format';
import { Button, Card, Icon, Input, Select } from '@/shared/ui';
import { STATISTICS_PERIODS, STATISTICS_SCOPES } from '../model/statisticsModel.js';

const granularityLabels = Object.freeze({ DAILY: '일별', WEEKLY: '주별', MONTHLY: '월별' });

export function StatisticsFilters({
  period,
  range,
  granularity,
  scopeType,
  locationId,
  locationOptions,
  onPeriodChange,
  onCustomRangeChange,
  onScopeTypeChange,
  onLocationChange,
}) {
  return (
    <Card asChild padding="md" className="shadow-[var(--shadow-soft)]">
      <section aria-label="재고 통계 조회 조건" className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
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
            <div className="mt-3 grid gap-2 text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)] sm:flex sm:flex-wrap sm:items-end">
              <label className="grid gap-1 text-[length:var(--font-size-meta)] font-[var(--font-weight-semibold)] text-[color:var(--text-body)]">
                시작일
                <Input
                  type="date"
                  size="sm"
                  className="sm:w-[168px]"
                  value={range.from}
                  max={range.to}
                  aria-label="통계 시작일"
                  onChange={(event) => onCustomRangeChange({ ...range, from: event.target.value })}
                />
              </label>
              <span className="hidden pb-2 sm:inline" aria-hidden="true">
                ~
              </span>
              <label className="grid gap-1 text-[length:var(--font-size-meta)] font-[var(--font-weight-semibold)] text-[color:var(--text-body)]">
                종료일
                <Input
                  type="date"
                  size="sm"
                  className="sm:w-[168px]"
                  value={range.to}
                  min={range.from}
                  aria-label="통계 종료일"
                  onChange={(event) => onCustomRangeChange({ ...range, to: event.target.value })}
                />
              </label>
              <span className="rounded-full bg-[var(--surface-subtle)] px-2 py-1 sm:mb-1">
                {granularityLabels[granularity]} 추이
              </span>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">
              <Icon icon={Calendar} size={16} aria-hidden="true" />
              <strong className="text-[color:var(--text-heading)]">
                {formatDate(range.from)} ~ {formatDate(range.to)}
              </strong>
              <span className="rounded-full bg-[var(--surface-subtle)] px-2 py-1">
                {granularityLabels[granularity]} 추이
              </span>
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
          <label className="grid gap-1.5 text-[length:var(--font-size-meta)] font-[var(--font-weight-semibold)] text-[color:var(--text-body)]">
            통계 범위
            <Select
              value={scopeType}
              aria-label="통계 범위"
              onChange={(event) => onScopeTypeChange(event.target.value)}
            >
              {STATISTICS_SCOPES.map((scope) => (
                <option key={scope.value} value={scope.value}>
                  {scope.label}
                </option>
              ))}
            </Select>
          </label>

          <label className="grid gap-1.5 text-[length:var(--font-size-meta)] font-[var(--font-weight-semibold)] text-[color:var(--text-body)]">
            세부 위치
            <Select
              value={locationId}
              aria-label="세부 위치"
              disabled={scopeType === 'NATIONAL' || scopeType === 'UNASSIGNED'}
              onChange={(event) => onLocationChange(event.target.value)}
            >
              <option value="ALL">전체</option>
              {locationOptions.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </section>
    </Card>
  );
}
