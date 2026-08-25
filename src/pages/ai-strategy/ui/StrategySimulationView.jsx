import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowLeft, Check, Refresh, Send } from 'reicon-react';
import {
  adjustAiStrategySimulation,
  aiStrategyKeys,
  applyAdjustedSimulationResult,
  buildStrategyAdjustmentPayload,
  buildStrategyChartData,
  getStrategyAdjustmentValidationError,
  getStrategyAdjustmentDefaults,
  getSimulationComparisonRows,
  resolveStrategyActionType,
  resolveStrategyLocationPresentation,
  sortStrategyOptions,
} from '@/entities/strategy';
import { formatCurrency, formatDate, formatNumber, formatQuantity } from '@/shared/lib/format';
import {
  Alert,
  Badge,
  Button,
  Card,
  DetailLayout,
  Icon,
  Input,
  Table,
  TableElement,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/shared/ui';
import { ReviewerSelectionModal } from './ReviewerSelectionModal.jsx';
import { StrategySelectionConflictModal } from './StrategySelectionConflictModal.jsx';

const chartColors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];
const visibleSimulationResultKeys = new Set([
  'expectedSalesQty',
  'expectedRevenue',
  'totalContributionMargin',
  'contributionMarginRate',
  'expectedDisposalQty',
  'netEffect',
]);

function formatRate(rate) {
  return `${formatNumber((rate ?? 0) * 100, { maximumFractionDigits: 1 })}%`;
}

function formatMetricValue(kind, value) {
  if (value === null || value === undefined) return kind === 'days' ? '기간 내 미소진' : '-';
  if (kind === 'currency') return formatCurrency(value);
  if (kind === 'rate' || kind === 'economicEffect') return formatRate(value);
  if (kind === 'days') return `${formatNumber(value)}일`;
  return formatQuantity(value);
}

function formatChange(kind, value) {
  if (value === null || value === undefined) return '-';
  const sign = value > 0 ? '+' : '';
  if (kind === 'currency') return `${sign}${formatCurrency(value)}`;
  if (kind === 'rate') return `${sign}${formatNumber(value * 100, { maximumFractionDigits: 1 })}%p`;
  if (kind === 'days') return `${sign}${formatNumber(value)}일`;
  return `${sign}${formatQuantity(value)}`;
}

function areAdjustmentValuesEqual(left, right) {
  if (Object.is(left, right)) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every((key) => Object.hasOwn(right, key) && areAdjustmentValuesEqual(left[key], right[key]))
  );
}

function StrategySwitcher({ strategyCase, options, activeOptionKey, finalOptionKey, onActivate }) {
  return (
    <section aria-labelledby="strategy-switcher-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--primary)]">SIMULATION</p>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
            <h2 id="strategy-switcher-title" className="text-xl font-bold text-[color:var(--text-heading)]">
              전략 비교 시뮬레이션
            </h2>
            <span
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-semibold text-[color:var(--text-body)] shadow-sm"
              title={`${strategyCase.caseName} · ${strategyCase.sku.skuName}`}
            >
              <span className="shrink-0 text-[color:var(--primary)]">전략 #{strategyCase.strategyCaseId}</span>
              <span aria-hidden="true" className="text-[color:var(--border-strong)]">
                ·
              </span>
              <span className="max-w-52 truncate">{strategyCase.caseName}</span>
            </span>
          </div>
        </div>
        <div className="min-w-0 max-w-full overflow-x-auto pb-1" role="group" aria-label="시뮬레이션 전략 선택">
          <div className="flex w-max min-w-full gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-1">
            {options.map((option) => {
              const active = option.optionKey === activeOptionKey;
              const final = option.optionKey === finalOptionKey;
              const actionLabel = option.actions
                .map((action) => resolveStrategyActionType(action.actionType).label)
                .join(' + ');

              return (
                <button
                  key={option.optionKey}
                  type="button"
                  aria-label={`${option.rank}안 ${option.optionName}`}
                  aria-pressed={active}
                  title={option.optionName}
                  onClick={() => onActivate(option.optionKey)}
                  className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                    active
                      ? 'bg-[var(--card)] text-[color:var(--primary)] shadow-sm'
                      : 'text-[color:var(--text-muted)] hover:bg-[var(--card)] hover:text-[color:var(--text-heading)]'
                  }`}
                >
                  <strong>{option.rank}안</strong>
                  <span aria-hidden="true" className="text-[color:var(--border-strong)]">
                    ·
                  </span>
                  <span>{actionLabel}</span>
                  {final ? (
                    <span className="ml-0.5 inline-flex items-center gap-0.5 text-[color:var(--good)]">
                      <Icon icon={Check} size={12} /> 최종
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function EditableRange({ label, value, displayValue, min = 0, max = 100, step = 1, onChange }) {
  const numericValue = Math.min(Math.max(Number(value) || 0, min), max);
  const progress = max === min ? 0 : ((numericValue - min) / (max - min)) * 100;

  return (
    <label className="grid min-w-0 gap-2 text-sm font-semibold text-[color:var(--text-body)]">
      <span className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <span>{label}</span>
        <strong className="shrink-0 tabular-nums text-[color:var(--text-heading)]">{displayValue}</strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={numericValue}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
        className="strategy-adjustment-range w-full"
        style={{ '--range-progress': `${progress}%` }}
      />
    </label>
  );
}

function ReadOnlyCondition({ label, children }) {
  return (
    <dl className="grid min-w-0 gap-1 rounded-lg bg-[var(--surface-subtle)] p-3 text-xs">
      <dt className="text-[color:var(--text-muted)]">{label}</dt>
      <dd className="break-words font-semibold text-[color:var(--text-heading)]">{children}</dd>
    </dl>
  );
}

function DateRangeFields({ actionOrder, values, minimumDate, maximumDate, onChange }) {
  const startMaximumDate =
    values.endDate && maximumDate
      ? values.endDate < maximumDate
        ? values.endDate
        : maximumDate
      : values.endDate || maximumDate;
  return (
    <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
      <label className="grid min-w-0 gap-2 text-xs font-semibold text-[color:var(--text-body)]">
        시작일
        <Input
          type="date"
          value={values.startDate}
          min={minimumDate || undefined}
          max={startMaximumDate || undefined}
          onChange={(event) => onChange(actionOrder, 'startDate', event.target.value)}
          aria-label={`액션 ${actionOrder} 시작일`}
          className="min-w-0"
        />
      </label>
      <label className="grid min-w-0 gap-2 text-xs font-semibold text-[color:var(--text-body)]">
        종료일
        <Input
          type="date"
          value={values.endDate}
          min={values.startDate || undefined}
          max={maximumDate || undefined}
          onChange={(event) => onChange(actionOrder, 'endDate', event.target.value)}
          aria-label={`액션 ${actionOrder} 종료일`}
          className="min-w-0"
        />
      </label>
    </div>
  );
}

function ActionConditionSection({ option, action, values, maxQuantity, maxDiscountPercent, onChange }) {
  const meta = resolveStrategyActionType(action.actionType);
  const locationPresentation = resolveStrategyLocationPresentation({
    ...action,
    sourceLocation: values.sourceLocation,
    targetLocation: values.targetLocation,
  });
  const isLocationAction = action.actionType === 'REALLOCATION' || action.actionType === 'RT_TRANSFER';
  const isChannelAction = action.actionType === 'CHANNEL_EXPANSION' || action.actionType === 'CHANNEL_CONCENTRATION';
  const isDiscountAction = action.actionType === 'PRICE_DISCOUNT';
  const quantityLabel = locationPresentation?.quantityLabel ?? (isDiscountAction ? '할인 적용 수량' : '채널 적용 수량');
  const targetLabel = isChannelAction
    ? action.actionType === 'CHANNEL_EXPANSION'
      ? '추가 판매 채널'
      : '집중 판매 채널'
    : '도착 판매처';

  return (
    <section className="grid min-w-0 gap-5 rounded-xl border border-[var(--border)] p-4">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--primary-soft)] text-xs font-bold text-[color:var(--primary)]">
          {action.actionOrder}
        </span>
        <Badge variant={meta.variant}>{meta.label}</Badge>
        {locationPresentation ? (
          <Badge variant={locationPresentation.badgeVariant}>{locationPresentation.badge}</Badge>
        ) : null}
        <strong className="min-w-0 text-sm text-[color:var(--text-heading)]">액션 조건</strong>
      </div>

      <EditableRange
        label={quantityLabel}
        value={values.quantity}
        max={maxQuantity}
        displayValue={formatQuantity(values.quantity)}
        onChange={(value) => onChange(action.actionOrder, 'quantity', value)}
      />

      {isLocationAction && locationPresentation ? (
        <div className="grid min-w-0 gap-2">
          <ReadOnlyCondition label={locationPresentation.sourceLabel}>
            {locationPresentation.sourceValue}
          </ReadOnlyCondition>
          <span aria-hidden="true" className="text-center text-lg leading-none text-[color:var(--text-muted)]">
            ↓
          </span>
          <ReadOnlyCondition label={locationPresentation.targetLabel}>
            {locationPresentation.targetValue}
          </ReadOnlyCondition>
          <p className="rounded-lg bg-[var(--surface-subtle)] px-3 py-2 text-xs leading-5 text-[color:var(--text-muted)]">
            {locationPresentation.description}
          </p>
        </div>
      ) : null}

      {isChannelAction ? (
        <div className="grid min-w-0 gap-3">
          <ReadOnlyCondition label={targetLabel}>
            {values.targetLocation?.locationName ?? '서버 자동 선택'}
          </ReadOnlyCondition>
        </div>
      ) : null}

      {isDiscountAction && (
        <>
          <EditableRange
            label="할인율"
            value={values.discountPercent}
            min={5}
            max={maxDiscountPercent}
            step={5}
            displayValue={`${formatNumber(values.discountPercent, { maximumFractionDigits: 0 })}%`}
            onChange={(value) => onChange(action.actionOrder, 'discountPercent', value)}
          />
          <ReadOnlyCondition label="전략 판매가">{formatCurrency(values.strategyPrice)}</ReadOnlyCondition>
        </>
      )}

      <DateRangeFields
        actionOrder={action.actionOrder}
        values={values}
        minimumDate={option.adjustmentConstraints?.minimumStartDate}
        maximumDate={option.adjustmentConstraints?.latestSelectableEndDate}
        onChange={onChange}
      />

      {!isDiscountAction && (
        <ReadOnlyCondition
          label={
            isChannelAction
              ? '채널 운영 비용'
              : action.actionType === 'REALLOCATION'
                ? '재할당 실행 비용'
                : '이동·실행 비용'
          }
        >
          {formatCurrency(values.actionCost)}
        </ReadOnlyCondition>
      )}

      {action.lotAllocations?.length ? (
        <dl className="grid min-w-0 gap-1 rounded-lg bg-[var(--surface-subtle)] p-3 text-xs">
          <dt className="text-[color:var(--text-muted)]">적용 LOT</dt>
          <dd className="break-all font-semibold leading-5 text-[color:var(--text-heading)]">
            {action.lotAllocations.map((lot) => lot.lotCode ?? `LOT ${lot.lotId}`).join(', ')}
          </dd>
        </dl>
      ) : null}
    </section>
  );
}

function ConditionPanel({
  option,
  values,
  defaults,
  appliedValues,
  maxQuantity,
  maxDiscountPercent,
  applied,
  applying,
  error,
  onChange,
  onReset,
}) {
  const recommendationUnchanged = areAdjustmentValuesEqual(values, defaults);
  const unappliedChanges = !areAdjustmentValuesEqual(values, appliedValues ?? defaults);
  const validationError = getStrategyAdjustmentValidationError(option, values);
  return (
    <Card padding="none" className="min-w-0 overflow-clip" data-testid="strategy-condition-panel">
      <div className="border-b border-[var(--border)] p-5">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[color:var(--text-heading)]">조건 조정</h2>
            <p className="mt-1 break-words text-xs leading-5 text-[color:var(--text-muted)]">{option.optionName}</p>
          </div>
          <Badge variant={applied ? 'good' : unappliedChanges ? 'info' : 'neutral'}>
            {applied ? '서버 계산 완료' : unappliedChanges ? '변경 미적용' : 'AI 추천 조건'}
          </Badge>
        </div>
      </div>

      <div className="grid min-w-0 gap-5 p-5">
        {option.adjustmentConstraints?.requiresPeriodAdjustment ? (
          <Alert variant="warning" title="전략 기간을 조정해 주세요.">
            선택한 LOT의 소비기한을 기준으로 종료일은 {formatDate(option.adjustmentConstraints.latestSelectableEndDate)}
            까지만 선택할 수 있습니다.
          </Alert>
        ) : null}

        {error ? (
          <Alert variant="danger" title="조정 시뮬레이션을 실행하지 못했습니다.">
            {error.message}
          </Alert>
        ) : null}

        <div className="grid min-w-0 gap-4">
          {option.actions.map((action) => (
            <ActionConditionSection
              key={action.actionOrder}
              option={option}
              action={action}
              values={values.actions[action.actionOrder]}
              maxQuantity={maxQuantity}
              maxDiscountPercent={maxDiscountPercent}
              onChange={onChange}
            />
          ))}
        </div>

        <Button type="button" variant="secondary" onClick={onReset} disabled={recommendationUnchanged}>
          <Icon icon={Refresh} size={15} /> 추천값 복원
        </Button>
        {unappliedChanges && validationError ? (
          <p role="alert" className="-mt-3 text-center text-xs font-medium text-[color:var(--danger)]">
            {validationError}
          </p>
        ) : null}
        <p aria-live="polite" className="-mt-3 text-center text-xs leading-5 text-[color:var(--text-muted)]">
          {applying
            ? '변경한 조건으로 차트와 예상 결과를 계산하고 있습니다.'
            : '조건 적용 시 서버가 SKU 전체 재고를 기준으로'}
          {!applying ? (
            <>
              <br />
              차트와 예상 결과를 다시 계산합니다.
            </>
          ) : null}
        </p>
      </div>
    </Card>
  );
}

function StrategyChart({ strategyCase, options, activeOption, chartRange }) {
  const [chartTab, setChartTab] = useState('contributionMargin');
  const chartData = useMemo(
    () => buildStrategyChartData({ ...strategyCase, options }, chartRange),
    [chartRange, options, strategyCase],
  );
  const periodDays = chartData.length;

  return (
    <Card padding="lg" className="min-w-0">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[color:var(--text-heading)]">시뮬레이션 차트</h2>
          <p className="mt-1 text-xs text-[color:var(--text-muted)]">
            {activeOption.optionName} · {formatNumber(periodDays)}일 예측 평가 결과
          </p>
        </div>
        <Tabs value={chartTab} onValueChange={setChartTab}>
          {({ value, setValue }) => (
            <TabsList aria-label="시뮬레이션 차트 종류" className="rounded-lg border border-[var(--border)] p-1">
              <TabsTrigger value="contributionMargin" activeValue={value} onSelect={setValue}>
                공헌이익
              </TabsTrigger>
              <TabsTrigger value="inventory" activeValue={value} onSelect={setValue}>
                재고 추이
              </TabsTrigger>
            </TabsList>
          )}
        </Tabs>
      </div>

      <div className="h-[280px] min-w-0 sm:h-[340px]" data-testid="strategy-simulation-chart">
        <ResponsiveContainer width="100%" height="100%">
          {chartTab === 'inventory' ? (
            <LineChart data={chartData} margin={{ top: 8, right: 20, left: 4, bottom: 8 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid)" />
              <XAxis dataKey="date" tickFormatter={(date) => date.slice(5).replace('-', '.')} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={36} />
              <RechartsTooltip
                labelFormatter={(date) => formatDate(date)}
                formatter={(value, name) => [formatQuantity(value), name]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="baselineRemainingQty"
                name="무전략 기준"
                stroke="var(--chart-baseline)"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              {options.map((option, index) => {
                const active = option.optionKey === activeOption.optionKey;
                return (
                  <Line
                    key={option.optionKey}
                    type="monotone"
                    dataKey={`${option.optionKey}RemainingQty`}
                    name={`${option.rank}안 ${option.optionName}`}
                    stroke={chartColors[index % chartColors.length]}
                    strokeWidth={active ? 4 : 1.5}
                    strokeOpacity={active ? 1 : 0.4}
                    dot={false}
                    isAnimationActive={false}
                  />
                );
              })}
            </LineChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 8, right: 20, left: 16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid)" />
              <XAxis dataKey="date" tickFormatter={(date) => date.slice(5).replace('-', '.')} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(value) => `${Math.round(value / 10000)}만`} tick={{ fontSize: 11 }} width={56} />
              <RechartsTooltip
                labelFormatter={(date) => formatDate(date)}
                formatter={(value, name) => [formatCurrency(value), name]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="baselineContributionMargin"
                name="무전략 기준 누적 공헌이익"
                stroke="var(--chart-baseline)"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              {options.map((option, index) => {
                const active = option.optionKey === activeOption.optionKey;
                return (
                  <Line
                    key={option.optionKey}
                    type="monotone"
                    dataKey={`${option.optionKey}ContributionMargin`}
                    name={`${option.rank}안 ${option.optionName}`}
                    stroke={chartColors[index % chartColors.length]}
                    strokeWidth={active ? 4 : 1.5}
                    strokeOpacity={active ? 1 : 0.4}
                    dot={false}
                    isAnimationActive={false}
                  />
                );
              })}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function SimulationResultTable({ strategyCase, option }) {
  const rows = getSimulationComparisonRows(strategyCase, option).filter((row) =>
    visibleSimulationResultKeys.has(row.key),
  );
  return (
    <Card padding="lg">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-[color:var(--text-heading)]">현재 전략 예상 결과</h2>
        <p className="mt-1 text-xs text-[color:var(--text-muted)]">{option.optionName}</p>
      </div>
      <Table surface="bordered" density="default">
        <TableElement className="min-w-[640px]">
          <caption className="sr-only">현재 전략 예상 결과와 기준 시나리오 비교</caption>
          <thead className="bg-[var(--surface-subtle)] text-left text-xs text-[color:var(--text-muted)]">
            <tr>
              <th scope="col" className="px-4 py-3">
                결과 항목
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                AI 추천값
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                기준 시나리오 대비
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] text-sm">
            {rows.map((row) => {
              const favorable =
                row.kind === 'economicEffect'
                  ? row.amount > 0
                  : row.key === 'expectedRemainingQty' ||
                      row.key === 'expectedSellThroughDays' ||
                      row.key === 'expectedDisposalQty'
                    ? row.change < 0
                    : row.key === 'movementCost'
                      ? false
                      : row.change > 0;
              return (
                <tr key={row.key}>
                  <th scope="row" className="px-4 py-3 text-left font-medium text-[color:var(--text-body)]">
                    {row.label}
                  </th>
                  <td className="px-4 py-3 text-right">
                    <strong className="tabular-nums text-[color:var(--text-heading)]">
                      {formatMetricValue(row.kind, row.value)}
                    </strong>
                    <span className="mt-0.5 block text-xs text-[color:var(--text-muted)]">
                      {row.kind === 'economicEffect'
                        ? '무전략 공헌이익 대비'
                        : `기준 ${formatMetricValue(row.kind, row.baselineValue)}`}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-bold tabular-nums ${
                      favorable ? 'text-[color:var(--good)]' : 'text-[color:var(--text-body)]'
                    }`}
                  >
                    {row.kind === 'economicEffect' ? formatCurrency(row.amount) : formatChange(row.kind, row.change)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableElement>
      </Table>
    </Card>
  );
}

function ActionTimeline({ option }) {
  return (
    <Card padding="lg">
      <h2 className="text-lg font-bold text-[color:var(--text-heading)]">실행 액션</h2>
      <p className="mt-1 text-xs text-[color:var(--text-muted)]">서버가 검증한 액션을 순서대로 표시합니다.</p>
      <ol className="mt-5 grid gap-3">
        {option.actions.map((action) => {
          const meta = resolveStrategyActionType(action.actionType);
          return (
            <li key={action.actionOrder} className="grid grid-cols-[32px_1fr] gap-3">
              <span className="grid size-8 place-items-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">
                {action.actionOrder}
              </span>
              <div className="rounded-xl border border-[var(--border)] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                  <strong className="text-sm text-[color:var(--text-heading)]">
                    {action.sourceLocation ? `${action.sourceLocation.locationName} → ` : ''}
                    {action.targetLocation?.locationName}
                  </strong>
                </div>
                <p className="mt-2 text-xs leading-5 text-[color:var(--text-muted)]">
                  {formatQuantity(action.actionQuantity)} · {formatDate(action.startDate)}~{formatDate(action.endDate)}{' '}
                  · 실행비 {formatCurrency(action.estimatedActionCost)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      {option.constraints ? (
        <div className="mt-4 rounded-xl bg-[var(--surface-subtle)] p-4 text-xs leading-5 text-[color:var(--text-body)]">
          <strong className="text-[color:var(--primary)]">계산 가정 및 유의사항</strong> · {option.constraints}
        </div>
      ) : null}
    </Card>
  );
}

function resolveMaximumDiscountPercent(option) {
  const serverLimit = option.adjustmentPolicy?.maximumDiscountRate;
  if (Number.isFinite(serverLimit)) return serverLimit * 100;

  const discountAction = option.actions.find((action) => action.actionType === 'PRICE_DISCOUNT');
  const locationCode = discountAction?.targetLocation?.locationCode ?? discountAction?.sourceLocation?.locationCode;
  return locationCode?.startsWith('DEPT_') ? 20 : 30;
}

export function StrategySimulationView({ strategyCase, activeOption, listPath, onActiveOptionChange }) {
  const options = useMemo(() => sortStrategyOptions(strategyCase.options), [strategyCase.options]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [finalOptionKey, setFinalOptionKey] = useState(null);
  const [reviewerModalOpen, setReviewerModalOpen] = useState(false);
  const [selectionConflict, setSelectionConflict] = useState(null);
  const [deliveryResult, setDeliveryResult] = useState(null);
  const adjustmentDefaultsByOption = useMemo(
    () =>
      Object.fromEntries(
        options.map((option) => [
          option.optionKey,
          { values: getStrategyAdjustmentDefaults(option), applied: false, appliedValues: null },
        ]),
      ),
    [options],
  );
  const [adjustmentStateByOption, setAdjustmentStateByOption] = useState(() => adjustmentDefaultsByOption);
  const [simulatedOptionsByKey, setSimulatedOptionsByKey] = useState({});
  const [adjustmentErrorsByOption, setAdjustmentErrorsByOption] = useState({});
  const adjustmentRevisionByOptionRef = useRef({});
  const applyAdjustmentRef = useRef(null);
  const simulationMutation = useMutation({
    mutationFn: ({ optionKey, payload }) => adjustAiStrategySimulation(strategyCase.strategyCaseId, optionKey, payload),
  });
  const comparePath = `/ai-strategy/${strategyCase.strategyCaseId}`;
  const finalOption = options.find((option) => option.optionKey === finalOptionKey) ?? null;
  const readyToExecute =
    strategyCase.caseStatus === 'READY_TO_EXECUTE' || deliveryResult?.caseStatus === 'READY_TO_EXECUTE';
  const selectionLocked = readyToExecute || Boolean(deliveryResult);
  const adjustmentDefaults = adjustmentDefaultsByOption[activeOption.optionKey];
  const adjustmentState = adjustmentStateByOption[activeOption.optionKey] ?? adjustmentDefaults;
  const adjustment = adjustmentState.values;
  const authoritativeOption = simulatedOptionsByKey[activeOption.optionKey] ?? activeOption;
  const displayedActiveOption = authoritativeOption;
  const displayedOptions = useMemo(
    () =>
      options.map((option) =>
        option.optionKey === activeOption.optionKey
          ? authoritativeOption
          : (simulatedOptionsByKey[option.optionKey] ?? option),
      ),
    [activeOption.optionKey, authoritativeOption, options, simulatedOptionsByKey],
  );
  const displayedChartRange = useMemo(() => {
    const periodValues = Object.values(adjustment.actions).find((values) => values.startDate || values.endDate);
    return {
      startDate: periodValues?.startDate || displayedActiveOption.chartRange?.startDate,
      endDate: periodValues?.endDate || displayedActiveOption.chartRange?.endDate,
    };
  }, [adjustment.actions, displayedActiveOption.chartRange]);
  const closeReviewerModal = useCallback(() => setReviewerModalOpen(false), []);
  const handleSelectionConflict = useCallback((error) => {
    setReviewerModalOpen(false);
    setSelectionConflict(error);
  }, []);
  const handleTeamsCompleted = useCallback(
    (result) => {
      setDeliveryResult(result);
      setFinalOptionKey(result.selectedOptionId);
      queryClient.setQueryData(aiStrategyKeys.detail(strategyCase.strategyCaseId), (current) =>
        current
          ? {
              ...current,
              caseStatus: result.caseStatus,
              selectedOptionId: result.selectedOptionId,
            }
          : current,
      );
      queryClient.invalidateQueries({ queryKey: aiStrategyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: aiStrategyKeys.detail(strategyCase.strategyCaseId) });
    },
    [queryClient, strategyCase.strategyCaseId],
  );
  const maxQuantity =
    Number(displayedActiveOption.maxExecutableQty) ||
    strategyCase.baselineSimulation.dailySeries[0]?.expectedRemainingQty ||
    100;
  const maxDiscountPercent = resolveMaximumDiscountPercent(displayedActiveOption);
  const activeMutation = simulationMutation.variables?.optionKey === activeOption.optionKey;

  function handleConditionChange(actionOrder, field, value) {
    adjustmentRevisionByOptionRef.current[activeOption.optionKey] =
      (adjustmentRevisionByOptionRef.current[activeOption.optionKey] ?? 0) + 1;
    setAdjustmentErrorsByOption((current) => ({ ...current, [activeOption.optionKey]: null }));
    setAdjustmentStateByOption((current) => {
      const optionState = current[activeOption.optionKey] ?? adjustmentDefaults;
      const actionValues = optionState.values.actions[actionOrder];
      const defaultActionValues = adjustmentDefaults.values.actions[actionOrder];
      let nextActionValues = { ...actionValues, [field]: value };

      if (field === 'discountPercent') {
        const listPrice =
          defaultActionValues.discountPercent >= 100
            ? defaultActionValues.strategyPrice
            : defaultActionValues.strategyPrice / (1 - defaultActionValues.discountPercent / 100);
        nextActionValues = {
          ...nextActionValues,
          strategyPrice: Math.max(0, Math.round((listPrice * (1 - value / 100)) / 100) * 100),
        };
      }

      let nextActions = { ...optionState.values.actions, [actionOrder]: nextActionValues };
      if (field === 'quantity' || field === 'startDate' || field === 'endDate') {
        nextActions = Object.fromEntries(
          Object.entries(nextActions).map(([order, values]) => [
            order,
            Object.hasOwn(values, field) ? { ...values, [field]: value } : values,
          ]),
        );
      }

      return {
        ...current,
        [activeOption.optionKey]: {
          ...optionState,
          values: {
            ...optionState.values,
            actions: nextActions,
          },
          applied: false,
        },
      };
    });
  }

  async function handleApplyAdjustment() {
    const optionKey = activeOption.optionKey;
    const requestRevision = adjustmentRevisionByOptionRef.current[optionKey] ?? 0;
    try {
      const payload = buildStrategyAdjustmentPayload(displayedActiveOption, adjustment);
      const result = await simulationMutation.mutateAsync({ optionKey, payload });
      if ((adjustmentRevisionByOptionRef.current[optionKey] ?? 0) !== requestRevision) return;
      const adjustedOption = applyAdjustedSimulationResult(displayedActiveOption, result);
      const adjustedValues = getStrategyAdjustmentDefaults(adjustedOption);

      setSimulatedOptionsByKey((current) => ({ ...current, [optionKey]: adjustedOption }));
      setAdjustmentStateByOption((current) => ({
        ...current,
        [optionKey]: { values: adjustedValues, applied: true, appliedValues: adjustedValues },
      }));
      setAdjustmentErrorsByOption((current) => ({ ...current, [optionKey]: null }));
    } catch (error) {
      if ((adjustmentRevisionByOptionRef.current[optionKey] ?? 0) === requestRevision) {
        setAdjustmentErrorsByOption((current) => ({ ...current, [optionKey]: error }));
      }
    }
  }

  applyAdjustmentRef.current = handleApplyAdjustment;

  useEffect(() => {
    const appliedValues = adjustmentState.appliedValues ?? adjustmentDefaults.values;
    const hasUnappliedChanges = !areAdjustmentValuesEqual(adjustment, appliedValues);
    const validationError = getStrategyAdjustmentValidationError(displayedActiveOption, adjustment);
    if (!hasUnappliedChanges || validationError) return undefined;

    const timeoutId = window.setTimeout(() => {
      void applyAdjustmentRef.current?.();
    }, 500);
    return () => window.clearTimeout(timeoutId);
  }, [adjustment, adjustmentDefaults.values, adjustmentState.appliedValues, displayedActiveOption]);

  function handleResetAdjustment() {
    adjustmentRevisionByOptionRef.current[activeOption.optionKey] =
      (adjustmentRevisionByOptionRef.current[activeOption.optionKey] ?? 0) + 1;
    setAdjustmentStateByOption((current) => ({
      ...current,
      [activeOption.optionKey]: adjustmentDefaults,
    }));
    setSimulatedOptionsByKey((current) => {
      const next = { ...current };
      delete next[activeOption.optionKey];
      return next;
    });
    simulationMutation.reset();
    setAdjustmentErrorsByOption((current) => ({ ...current, [activeOption.optionKey]: null }));
  }

  function handleReadjustAfterConflict() {
    setSelectionConflict(null);
    requestAnimationFrame(() => {
      document.querySelector('[data-testid="strategy-condition-panel"]')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
    void handleApplyAdjustment();
  }

  return (
    <main className="page-shell pb-44 sm:pb-32" aria-labelledby="page-title">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-3">
        <Link to={comparePath} state={{ from: listPath }}>
          <Icon icon={ArrowLeft} size={16} /> AI 추천 전략 비교로 돌아가기
        </Link>
      </Button>

      <StrategySwitcher
        strategyCase={strategyCase}
        options={options}
        activeOptionKey={activeOption.optionKey}
        finalOptionKey={finalOptionKey}
        onActivate={onActiveOptionChange}
      />

      <DetailLayout
        aside="wide"
        className="mt-4 lg:grid-cols-1 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]"
        asideContent={
          <ConditionPanel
            option={displayedActiveOption}
            values={adjustment}
            defaults={adjustmentDefaults.values}
            appliedValues={adjustmentState.appliedValues}
            maxQuantity={maxQuantity}
            maxDiscountPercent={maxDiscountPercent}
            applied={adjustmentState.applied}
            applying={activeMutation && simulationMutation.isPending}
            error={adjustmentErrorsByOption[activeOption.optionKey]}
            onChange={handleConditionChange}
            onReset={handleResetAdjustment}
          />
        }
      >
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 overflow-hidden">
          <Card padding="md" className="grid gap-4">
            <div className="min-w-0">
              <span className="text-xs font-bold text-[color:var(--primary)]">AI 추천 이유</span>
              <p className="mt-1 break-words text-sm leading-6 text-[color:var(--text-body)]">
                {activeOption.recommendationReason}
              </p>
            </div>
            <div className="grid gap-3 border-t border-[var(--border)] pt-3 text-xs leading-5 md:grid-cols-2">
              <p className="min-w-0 break-words rounded-xl bg-[var(--surface-subtle)] px-3 py-2.5">
                <strong className="mr-1 text-[color:var(--good)]">장점</strong>
                <span className="text-[color:var(--text-body)]">{activeOption.advantage}</span>
              </p>
              <p className="min-w-0 break-words rounded-xl bg-[var(--surface-subtle)] px-3 py-2.5">
                <strong className="mr-1 text-[color:var(--warning)]">주의</strong>
                <span className="text-[color:var(--text-muted)]">{activeOption.caution}</span>
              </p>
            </div>
          </Card>
          <div className="w-full min-w-0 max-w-full rounded-[var(--radius-panel)]">
            <StrategyChart
              strategyCase={strategyCase}
              options={displayedOptions}
              activeOption={displayedActiveOption}
              chartRange={displayedChartRange}
            />
          </div>
          <SimulationResultTable strategyCase={strategyCase} option={displayedActiveOption} />
          <ActionTimeline option={displayedActiveOption} />
        </div>
      </DetailLayout>

      <section
        data-testid="strategy-simulation-action-bar"
        className="fixed bottom-0 left-[var(--app-sidebar-width)] right-0 z-20 border-t border-[var(--border)] bg-[color:var(--card)]/95 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur"
      >
        <div className="mx-auto grid w-full max-w-[1800px] gap-3 px-5 py-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <strong className="text-sm text-[color:var(--text-heading)]">
              {finalOptionKey ? '최종안이 선택되었습니다.' : 'Teams로 보낼 최종안을 선택해 주세요.'}
            </strong>
            <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
              {finalOptionKey
                ? `${options.find((option) => option.optionKey === finalOptionKey)?.rank}안을 최종안으로 표시 중입니다.`
                : '현재 검토 중인 전략을 하단 버튼으로 최종안으로 확정할 수 있습니다.'}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => setFinalOptionKey(activeOption.optionKey)}
              disabled={finalOptionKey === activeOption.optionKey || selectionLocked}
            >
              <Icon icon={Check} size={16} />
              {finalOptionKey === activeOption.optionKey ? '최종안 선택됨' : '이 전략을 최종안으로 선택'}
            </Button>
            <Button
              type="button"
              className="w-full"
              disabled={!finalOption || readyToExecute}
              onClick={() => setReviewerModalOpen(true)}
            >
              <Icon icon={Send} size={16} />
              {readyToExecute ? 'Teams 검토 요청 완료' : deliveryResult ? 'Teams 전송 결과' : 'Teams 검토 요청'}
            </Button>
          </div>
        </div>
      </section>

      {reviewerModalOpen && finalOption ? (
        <ReviewerSelectionModal
          strategyCaseId={strategyCase.strategyCaseId}
          option={finalOption}
          initialDeliveryResult={deliveryResult}
          onClose={closeReviewerModal}
          onCompleted={handleTeamsCompleted}
          onSelectionConflict={handleSelectionConflict}
        />
      ) : null}

      {selectionConflict ? (
        <StrategySelectionConflictModal
          error={selectionConflict}
          onClose={() => setSelectionConflict(null)}
          onReadjust={handleReadjustAfterConflict}
          onCreateNew={() => navigate('/inventory')}
        />
      ) : null}
    </main>
  );
}
