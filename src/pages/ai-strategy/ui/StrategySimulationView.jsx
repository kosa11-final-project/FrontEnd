import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowLeft, ChartBar, Check, DocumentText, Refresh, Send } from 'reicon-react';
import {
  buildAdjustedStrategyOption,
  buildStrategyChartData,
  getStrategyAdjustmentDefaults,
  getSimulationComparisonRows,
  resolveStrategyActionType,
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
  Select,
  Table,
  TableElement,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/shared/ui';

const chartColors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

function formatRate(rate) {
  return `${formatNumber((rate ?? 0) * 100, { maximumFractionDigits: 1 })}%`;
}

function formatMetricValue(kind, value) {
  if (value === null || value === undefined) return '기간 내 미소진';
  if (kind === 'currency') return formatCurrency(value);
  if (kind === 'rate') return formatRate(value);
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
      <p className="mt-2 text-right text-xs text-[color:var(--text-muted)]">
        전략 버튼은 비교 대상만 전환하며, 최종안은 하단 버튼에서 확정합니다.
      </p>
    </section>
  );
}

function EditableRange({ label, value, displayValue, min = 0, max = 100, onChange }) {
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
        value={numericValue}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
        className="strategy-adjustment-range w-full"
        style={{ '--range-progress': `${progress}%` }}
      />
    </label>
  );
}

function getLocationOptions(strategyCase, action) {
  const locations = new Map();
  const addLocation = (location) => {
    if (location?.locationId === null || location?.locationId === undefined) return;
    locations.set(String(location.locationId), location);
  };

  addLocation(action.targetLocation);
  strategyCase.requestConditions.candidateSalesPointIds?.forEach((locationId, index) => {
    addLocation({
      locationType: 'SALES_POINT',
      locationId,
      locationCode: `SP-${String(locationId).padStart(4, '0')}`,
      locationName: strategyCase.requestConditions.candidateSalesPointNames?.[index] ?? `판매처 ${locationId}`,
    });
  });

  return [...locations.values()];
}

function CurrencyInput({ label, ariaLabel, value, onChange }) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-semibold text-[color:var(--text-body)]">
      {label}
      <span className="relative min-w-0">
        <Input
          type="number"
          min="0"
          step="1000"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label={ariaLabel}
          className="min-w-0 pr-9 text-right font-semibold tabular-nums"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[color:var(--text-muted)]">원</span>
      </span>
    </label>
  );
}

function DateRangeFields({ actionOrder, values, onChange }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
      <label className="grid min-w-0 gap-2 text-xs font-semibold text-[color:var(--text-body)]">
        시작일
        <Input
          type="date"
          value={values.startDate}
          max={values.endDate || undefined}
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
          onChange={(event) => onChange(actionOrder, 'endDate', event.target.value)}
          aria-label={`액션 ${actionOrder} 종료일`}
          className="min-w-0"
        />
      </label>
    </div>
  );
}

function ActionConditionSection({ strategyCase, action, values, maxQuantity, onChange }) {
  const meta = resolveStrategyActionType(action.actionType);
  const locationOptions = getLocationOptions(strategyCase, action);
  const isLocationAction = action.actionType === 'REALLOCATION' || action.actionType === 'RT_TRANSFER';
  const isChannelAction = action.actionType === 'CHANNEL_EXPANSION' || action.actionType === 'CHANNEL_CONCENTRATION';
  const isDiscountAction = action.actionType === 'PRICE_DISCOUNT';
  const quantityLabel =
    action.actionType === 'RT_TRANSFER'
      ? '이동 수량'
      : action.actionType === 'REALLOCATION'
        ? '재할당 수량'
        : isDiscountAction
          ? '할인 적용 수량'
          : '채널 적용 수량';
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
        <strong className="min-w-0 text-sm text-[color:var(--text-heading)]">액션 조건</strong>
      </div>

      <EditableRange
        label={quantityLabel}
        value={values.quantity}
        max={maxQuantity}
        displayValue={formatQuantity(values.quantity)}
        onChange={(value) => onChange(action.actionOrder, 'quantity', value)}
      />

      {(isLocationAction || isChannelAction) && (
        <div className="grid min-w-0 gap-3">
          {isLocationAction && (
            <dl className="grid min-w-0 gap-1 rounded-lg bg-[var(--surface-subtle)] p-3 text-xs">
              <dt className="text-[color:var(--text-muted)]">출발 위치</dt>
              <dd className="break-words font-semibold text-[color:var(--text-heading)]">
                {values.sourceLocation?.locationName ?? '서버 자동 선택'}
              </dd>
            </dl>
          )}
          <label className="grid min-w-0 gap-2 text-sm font-semibold text-[color:var(--text-body)]">
            {targetLabel}
            <Select
              value={String(values.targetLocation?.locationId ?? '')}
              onChange={(event) => {
                const nextLocation = locationOptions.find(
                  (location) => String(location.locationId) === event.target.value,
                );
                onChange(action.actionOrder, 'targetLocation', nextLocation ?? values.targetLocation);
              }}
              aria-label={`액션 ${action.actionOrder} ${targetLabel}`}
              className="min-w-0"
            >
              {locationOptions.map((location) => (
                <option key={location.locationId} value={location.locationId}>
                  {location.locationName}
                </option>
              ))}
            </Select>
          </label>
        </div>
      )}

      {isDiscountAction && (
        <>
          <EditableRange
            label="할인율"
            value={values.discountPercent}
            max={50}
            displayValue={`${formatNumber(values.discountPercent, { maximumFractionDigits: 0 })}%`}
            onChange={(value) => onChange(action.actionOrder, 'discountPercent', value)}
          />
          <CurrencyInput
            label="전략 판매가"
            ariaLabel={`액션 ${action.actionOrder} 전략 판매가`}
            value={values.strategyPrice}
            onChange={(value) => onChange(action.actionOrder, 'strategyPrice', value)}
          />
        </>
      )}

      <DateRangeFields actionOrder={action.actionOrder} values={values} onChange={onChange} />

      {!isDiscountAction && (
        <CurrencyInput
          label={isChannelAction ? '채널 운영 비용' : '이동·실행 비용'}
          ariaLabel={`액션 ${action.actionOrder} 실행 비용`}
          value={values.actionCost}
          onChange={(value) => onChange(action.actionOrder, 'actionCost', value)}
        />
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

function ConditionPanel({ strategyCase, option, values, defaults, maxQuantity, saved, onChange, onReset, onSave }) {
  return (
    <Card padding="none" className="min-w-0 overflow-clip" data-testid="strategy-condition-panel">
      <div className="border-b border-[var(--border)] p-5">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[color:var(--text-heading)]">조건 조정</h2>
            <p className="mt-1 break-words text-xs leading-5 text-[color:var(--text-muted)]">{option.optionName}</p>
          </div>
          <Badge variant={saved ? 'good' : 'info'}>{saved ? '조정안 저장됨' : '데모 미리보기'}</Badge>
        </div>
      </div>

      <div className="grid min-w-0 gap-5 p-5">
        <Alert variant="info" title="조건 조정 미리보기">
          값을 바꾸면 차트와 예상 결과가 즉시 갱신됩니다. 현재 계산은 화면 시연용입니다.
        </Alert>

        <div className="grid min-w-0 gap-4">
          {option.actions.map((action) => (
            <ActionConditionSection
              key={action.actionOrder}
              strategyCase={strategyCase}
              action={action}
              values={values.actions[action.actionOrder]}
              maxQuantity={maxQuantity}
              onChange={onChange}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onReset}
            disabled={areAdjustmentValuesEqual(values, defaults)}
          >
            <Icon icon={Refresh} size={15} /> 추천값 복원
          </Button>
          <Button type="button" variant="secondary" onClick={onSave}>
            <Icon icon={DocumentText} size={15} /> 조정안 저장
          </Button>
        </div>
        <p className="-mt-3 text-center text-xs text-[color:var(--text-muted)]">
          서버 API 연결 전까지 이 화면에서만 유지됩니다.
        </p>
      </div>
    </Card>
  );
}

function StrategyChart({ strategyCase, options, activeOption }) {
  const [chartTab, setChartTab] = useState('inventory');
  const chartData = useMemo(() => buildStrategyChartData({ ...strategyCase, options }), [options, strategyCase]);
  const financialData = useMemo(
    () => [
      {
        name: '무전략 기준',
        revenue: strategyCase.baselineSimulation.summary.expectedRevenue,
        contributionMargin: strategyCase.baselineSimulation.summary.totalContributionMargin,
      },
      ...options.map((option) => ({
        name: `${option.rank}안`,
        revenue: option.simulationSummary.expectedRevenue,
        contributionMargin: option.simulationSummary.totalContributionMargin,
      })),
    ],
    [options, strategyCase.baselineSimulation.summary],
  );

  return (
    <Card padding="lg" className="min-w-0">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[color:var(--text-heading)]">시뮬레이션 차트</h2>
          <p className="mt-1 text-xs text-[color:var(--text-muted)]">{activeOption.optionName} · 8일 예상 변화</p>
        </div>
        <Tabs value={chartTab} onValueChange={setChartTab}>
          {({ value, setValue }) => (
            <TabsList aria-label="시뮬레이션 차트 종류" className="rounded-lg border border-[var(--border)] p-1">
              <TabsTrigger value="inventory" activeValue={value} onSelect={setValue}>
                재고 추이
              </TabsTrigger>
              <TabsTrigger value="finance" activeValue={value} onSelect={setValue}>
                매출·이익
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
                  />
                );
              })}
            </LineChart>
          ) : (
            <BarChart data={financialData} margin={{ top: 8, right: 20, left: 16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(value) => `${Math.round(value / 10000)}만`} tick={{ fontSize: 11 }} width={56} />
              <RechartsTooltip formatter={(value, name) => [formatCurrency(value), name]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="revenue" name="예상 매출" fill="var(--chart-2)" radius={[5, 5, 0, 0]} />
              <Bar dataKey="contributionMargin" name="예상 공헌이익" fill="var(--chart-1)" radius={[5, 5, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-xs text-[color:var(--text-muted)]">
        차트의 일별 값은 상세 Response에 시계열 계약이 추가되기 전까지 디자인 검증용 목업입니다.
      </p>
    </Card>
  );
}

function SimulationResultTable({ strategyCase, option }) {
  const rows = getSimulationComparisonRows(strategyCase, option);
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
                row.key === 'expectedRemainingQty' || row.key === 'expectedSellThroughDays'
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
                      기준 {formatMetricValue(row.kind, row.baselineValue)}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-bold tabular-nums ${
                      favorable ? 'text-[color:var(--good)]' : 'text-[color:var(--text-body)]'
                    }`}
                  >
                    {formatChange(row.kind, row.change)}
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
      <div className="mt-4 rounded-xl bg-[var(--surface-subtle)] p-4 text-xs leading-5 text-[color:var(--text-body)]">
        <strong className="text-[color:var(--primary)]">실행 제약</strong> · {option.constraints}
      </div>
    </Card>
  );
}

export function StrategySimulationView({ strategyCase, activeOption, listPath, onActiveOptionChange }) {
  const options = useMemo(() => sortStrategyOptions(strategyCase.options), [strategyCase.options]);
  const [finalOptionKey, setFinalOptionKey] = useState(null);
  const adjustmentDefaultsByOption = useMemo(
    () =>
      Object.fromEntries(
        options.map((option) => [option.optionKey, { values: getStrategyAdjustmentDefaults(option), saved: false }]),
      ),
    [options],
  );
  const [adjustmentStateByOption, setAdjustmentStateByOption] = useState(() => adjustmentDefaultsByOption);
  const comparePath = `/ai-strategy/${strategyCase.strategyCaseId}`;
  const maxQuantity = strategyCase.baselineSimulation.dailySeries[0]?.expectedRemainingQty ?? 100;
  const adjustmentDefaults = adjustmentDefaultsByOption[activeOption.optionKey];
  const adjustmentState = adjustmentStateByOption[activeOption.optionKey] ?? adjustmentDefaults;
  const adjustment = adjustmentState.values;
  const adjustmentSaved = adjustmentState.saved;

  const adjustedOption = useMemo(
    () => buildAdjustedStrategyOption(strategyCase, activeOption, adjustment),
    [activeOption, adjustment, strategyCase],
  );
  const displayedOptions = useMemo(
    () => options.map((option) => (option.optionKey === activeOption.optionKey ? adjustedOption : option)),
    [activeOption.optionKey, adjustedOption, options],
  );

  function handleConditionChange(actionOrder, field, value) {
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

      return {
        ...current,
        [activeOption.optionKey]: {
          values: {
            ...optionState.values,
            actions: { ...optionState.values.actions, [actionOrder]: nextActionValues },
          },
          saved: false,
        },
      };
    });
  }

  return (
    <main className="page-shell pb-40 sm:pb-28" aria-labelledby="page-title">
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
            strategyCase={strategyCase}
            option={adjustedOption}
            values={adjustment}
            defaults={adjustmentDefaults.values}
            maxQuantity={maxQuantity}
            saved={adjustmentSaved}
            onChange={handleConditionChange}
            onReset={() =>
              setAdjustmentStateByOption((current) => ({
                ...current,
                [activeOption.optionKey]: adjustmentDefaults,
              }))
            }
            onSave={() =>
              setAdjustmentStateByOption((current) => ({
                ...current,
                [activeOption.optionKey]: { values: adjustment, saved: true },
              }))
            }
          />
        }
      >
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 overflow-hidden">
          <Card padding="md" className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div>
              <span className="text-xs font-bold text-[color:var(--primary)]">AI 추천 이유</span>
              <p className="mt-1 text-sm leading-6 text-[color:var(--text-body)]">
                {activeOption.recommendationReason}
              </p>
            </div>
            <div className="grid gap-2 text-xs leading-5">
              <p>
                <strong className="text-[color:var(--good)]">장점</strong> · {activeOption.advantage}
              </p>
              <p className="text-[color:var(--text-muted)]">
                <strong className="text-[color:var(--warning)]">주의</strong> · {activeOption.caution}
              </p>
            </div>
          </Card>
          <div className="w-full min-w-0 max-w-full rounded-[var(--radius-panel)]">
            <StrategyChart strategyCase={strategyCase} options={displayedOptions} activeOption={adjustedOption} />
          </div>
          <SimulationResultTable strategyCase={strategyCase} option={adjustedOption} />
          <ActionTimeline option={adjustedOption} />
        </div>
      </DetailLayout>

      <section className="fixed bottom-0 left-0 right-0 z-20 border-t border-[var(--border)] bg-[color:var(--card)]/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:left-[76px] xl:left-[248px]">
        <div className="mx-auto flex max-w-[1368px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <strong className="text-sm text-[color:var(--text-heading)]">
              {finalOptionKey ? '최종안이 선택되었습니다.' : 'Teams로 보낼 최종안을 선택해 주세요.'}
            </strong>
            <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
              {finalOptionKey
                ? `${options.find((option) => option.optionKey === finalOptionKey)?.rank}안을 최종안으로 표시 중입니다.`
                : '현재 검토 중인 전략을 하단 버튼으로 최종안으로 확정할 수 있습니다.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFinalOptionKey(activeOption.optionKey)}
              disabled={finalOptionKey === activeOption.optionKey}
            >
              <Icon icon={Check} size={16} />
              {finalOptionKey === activeOption.optionKey ? '최종안 선택됨' : '이 전략을 최종안으로 선택'}
            </Button>
            <Button type="button" variant="secondary" disabled>
              <Icon icon={ChartBar} size={16} /> AI 최종 검토
            </Button>
            <Button type="button" disabled>
              <Icon icon={Send} size={16} /> Teams 검토 요청
            </Button>
          </div>
        </div>
        <span className="sr-only">후속 API 연결 후 Teams 검토 요청을 사용할 수 있습니다.</span>
      </section>
    </main>
  );
}
