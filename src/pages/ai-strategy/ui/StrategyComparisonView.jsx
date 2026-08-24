import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Calendar, Check, InfoCircle, Layers, Send, Store } from 'reicon-react';
import { Link } from 'react-router-dom';
import { aiStrategyKeys, resolveStrategyActionType, sortStrategyOptions } from '@/entities/strategy';
import { formatCurrency, formatDate, formatNumber, formatQuantity } from '@/shared/lib/format';
import { Alert, Badge, Button, Card, Icon } from '@/shared/ui';
import { ReviewerSelectionModal } from './ReviewerSelectionModal.jsx';
import { StrategyCaseSummary, StrategyDetailHeader } from './StrategyDetailShared.jsx';

function ConditionItem({ icon, label, children }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-card)] bg-[var(--surface-subtle)] p-3">
      <dt className="flex items-center gap-3 text-xs text-[color:var(--text-muted)]">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--card)] text-[color:var(--primary)]">
          <Icon icon={icon} size={16} />
        </span>
        {label}
      </dt>
      <dd className="mt-1 pl-11 text-sm font-semibold leading-5 text-[color:var(--text-heading)]">{children}</dd>
    </div>
  );
}

function RequestConditions({ conditions }) {
  return (
    <Card padding="lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[color:var(--text-heading)]">AI 생성 요청 조건</h2>
          <p className="mt-1 text-xs text-[color:var(--text-muted)]">사용자가 고정한 조건은 AI가 변경하지 않습니다.</p>
        </div>
        <Badge variant="outline">읽기 전용</Badge>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ConditionItem icon={Store} label="출발 판매처">
          {conditions.sourceSalesPointName ?? 'AI 자동 선택'}
        </ConditionItem>
        <ConditionItem icon={Layers} label="대상 LOT">
          {conditions.lotLabels?.join(', ') || 'AI 자동 선택'}
        </ConditionItem>
        <ConditionItem icon={Store} label="후보 판매처">
          {conditions.candidateSalesPointNames?.join(', ') || '접근 가능한 전체 판매처'}
        </ConditionItem>
        <ConditionItem icon={Calendar} label="희망 전략 기간">
          {conditions.preferredStartDate && conditions.preferredEndDate
            ? `${formatDate(conditions.preferredStartDate)} ~ ${formatDate(conditions.preferredEndDate)}`
            : 'AI 추천'}
        </ConditionItem>
      </dl>
    </Card>
  );
}

function StrategyOptionSummaryCard({ option, strategyCaseId, listPath, selected, selectionDisabled, onSelect }) {
  const summary = option.simulationSummary;
  const effect = summary.comparisonToBaseline.incrementalEconomicBenefit;
  const effectIsPositive = effect > 0;
  const effectIsNegative = effect < 0;

  return (
    <Card
      padding="none"
      className={`flex min-w-0 flex-col overflow-hidden ${
        selected ? 'border-[var(--primary)] ring-2 ring-[var(--ring-soft)]' : ''
      }`}
    >
      <div className="border-b border-[var(--border)] p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral" size="lg">
              {option.rank}안
            </Badge>
            {option.actions.map((action) => {
              const meta = resolveStrategyActionType(action.actionType);
              return (
                <Badge key={`${option.optionKey}-${action.actionOrder}`} variant={meta.variant}>
                  {meta.label}
                </Badge>
              );
            })}
          </div>
          {option.rank === 1 ? <Badge variant="warning">AI 추천</Badge> : null}
        </div>
        <h3 className="mt-4 text-lg font-bold leading-7 text-[color:var(--text-heading)]">{option.optionName}</h3>
        <p className="mt-3 text-sm leading-6 text-[color:var(--text-body)]">{option.recommendationReason}</p>
      </div>

      <div className="grid flex-1 gap-4 p-5">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-[var(--surface-subtle)] p-3">
            <span className="text-xs text-[color:var(--text-muted)]">예상 판매량</span>
            <strong className="mt-1 block text-lg text-[color:var(--text-heading)]">
              {formatQuantity(summary.expectedSalesQty)}
            </strong>
          </div>
          <div className="rounded-xl bg-[var(--surface-subtle)] p-3">
            <span className="text-xs text-[color:var(--text-muted)]">예상 잔여재고</span>
            <strong className="mt-1 block text-lg text-[color:var(--text-heading)]">
              {formatQuantity(summary.expectedRemainingQty)}
            </strong>
          </div>
          <div className="rounded-xl bg-[var(--surface-subtle)] p-3">
            <span className="text-xs text-[color:var(--text-muted)]">예상 공헌이익</span>
            <strong className="mt-1 block text-lg text-[color:var(--text-heading)]">
              {formatCurrency(summary.totalContributionMargin)}
            </strong>
          </div>
          <div
            className={`rounded-xl p-3 ${
              effectIsNegative
                ? 'bg-[var(--danger-soft)]'
                : effectIsPositive
                  ? 'bg-[var(--good-soft)]'
                  : 'bg-[var(--surface-subtle)]'
            }`}
          >
            <span
              className={`text-xs ${
                effectIsNegative
                  ? 'text-[color:var(--danger)]'
                  : effectIsPositive
                    ? 'text-[color:var(--good)]'
                    : 'text-[color:var(--text-muted)]'
              }`}
            >
              기준 대비 경제효과
            </span>
            <strong
              className={`mt-1 block text-lg ${
                effectIsNegative
                  ? 'text-[color:var(--danger)]'
                  : effectIsPositive
                    ? 'text-[color:var(--good)]'
                    : 'text-[color:var(--text-heading)]'
              }`}
            >
              {effectIsPositive ? '+' : ''}
              {formatCurrency(effect)}
            </strong>
          </div>
        </div>

        <div className="grid gap-2 text-xs leading-5">
          <p className="text-[color:var(--text-body)]">
            <strong className="text-[color:var(--primary)]">장점</strong> · {option.advantage}
          </p>
          <p className="text-[color:var(--text-muted)]">
            <strong className="text-[color:var(--warning)]">주의</strong> · {option.caution}
          </p>
        </div>

        <ol className="grid gap-2" aria-label={`${option.optionName} 실행 액션`}>
          {option.actions.map((action) => (
            <li key={action.actionOrder} className="flex items-center gap-2 text-xs text-[color:var(--text-body)]">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[var(--primary-soft)] font-bold text-[color:var(--primary)]">
                {action.actionOrder}
              </span>
              <span className="truncate">
                {resolveStrategyActionType(action.actionType).label}
                {action.targetLocation ? ` · ${action.targetLocation.locationName}` : ''}
                {action.actionQuantity ? ` · ${formatNumber(action.actionQuantity)}개` : ''}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-2 border-t border-[var(--border)] p-4 sm:grid-cols-2">
        <Button
          type="button"
          variant={selected ? 'primary' : 'secondary'}
          disabled={selectionDisabled}
          aria-pressed={selected}
          onClick={onSelect}
        >
          <Icon icon={Check} size={16} aria-hidden="true" />
          {selected ? '최종안 선택됨' : '이 전략을 최종안으로 선택'}
        </Button>
        <Button asChild>
          <Link
            to={`/ai-strategy/${strategyCaseId}/simulation?option=${encodeURIComponent(option.optionKey)}`}
            state={{ from: listPath }}
          >
            시뮬레이션 보기 <Icon icon={ArrowRight} size={16} />
          </Link>
        </Button>
      </div>
    </Card>
  );
}

export function StrategyComparisonView({ strategyCase, listPath }) {
  const options = sortStrategyOptions(strategyCase.options);
  const queryClient = useQueryClient();
  const [selectedOptionId, setSelectedOptionId] = useState(strategyCase.selectedOptionId ?? null);
  const [reviewerModalOpen, setReviewerModalOpen] = useState(false);
  const [deliveryResult, setDeliveryResult] = useState(null);
  const selectedOption = options.find((option) => option.optionId === selectedOptionId) ?? null;
  const readyToExecute = strategyCase.caseStatus === 'READY_TO_EXECUTE';
  const selectionLocked = readyToExecute || Boolean(deliveryResult);

  const closeReviewerModal = useCallback(() => setReviewerModalOpen(false), []);
  const handleTeamsCompleted = useCallback(
    (result) => {
      setDeliveryResult(result);
      setSelectedOptionId(result.selectedOptionId);
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

  return (
    <main className="page-shell" aria-labelledby="page-title">
      <StrategyDetailHeader strategyCase={strategyCase} backTo={listPath} />

      <div className="grid gap-4">
        <StrategyCaseSummary strategyCase={strategyCase} />
        <RequestConditions conditions={strategyCase.requestConditions} />
        <Alert variant="info" title={`AI가 실행 가능한 전략 ${options.length}개를 생성했습니다.`}>
          모든 대안을 비교한 뒤 최종안 하나를 선택하고 Teams 검토를 요청할 수 있습니다.
        </Alert>
        {deliveryResult ? (
          <Alert
            variant={
              deliveryResult.reviewers.every((reviewer) => reviewer.deliveryStatus === 'SENT') ? 'good' : 'warning'
            }
            title="Teams 검토 요청 결과가 반영되었습니다."
          >
            전송 성공 {deliveryResult.reviewers.filter((reviewer) => reviewer.deliveryStatus === 'SENT').length}명 ·
            전송 실패 {deliveryResult.reviewers.filter((reviewer) => reviewer.deliveryStatus !== 'SENT').length}명
          </Alert>
        ) : null}
      </div>

      <section className="mt-7" aria-labelledby="strategy-options-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--primary)]">AI OPTIONS</p>
            <h2 id="strategy-options-title" className="mt-1 text-xl font-bold text-[color:var(--text-heading)]">
              추천 전략 요약 비교
            </h2>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-[color:var(--text-muted)]">
              <Icon icon={InfoCircle} size={15} /> 추천 순위는 최종 선택이 아닙니다.
            </span>
            <Button
              type="button"
              disabled={!selectedOption || readyToExecute}
              onClick={() => setReviewerModalOpen(true)}
            >
              <Icon icon={Send} size={17} aria-hidden="true" />
              {readyToExecute ? 'Teams 검토 요청 완료' : deliveryResult ? 'Teams 전송 결과' : 'Teams로 전송'}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {options.map((option) => (
            <StrategyOptionSummaryCard
              key={option.optionKey}
              option={option}
              strategyCaseId={strategyCase.strategyCaseId}
              listPath={listPath}
              selected={option.optionId === selectedOptionId}
              selectionDisabled={!option.optionId || selectionLocked}
              onSelect={() => {
                setDeliveryResult(null);
                setSelectedOptionId(option.optionId);
              }}
            />
          ))}
        </div>
      </section>

      {reviewerModalOpen && selectedOption ? (
        <ReviewerSelectionModal
          strategyCaseId={strategyCase.strategyCaseId}
          option={selectedOption}
          initialDeliveryResult={deliveryResult}
          onClose={closeReviewerModal}
          onCompleted={handleTeamsCompleted}
        />
      ) : null}
    </main>
  );
}
