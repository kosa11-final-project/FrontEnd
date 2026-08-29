import { useState } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { InfoCircle } from 'reicon-react';
import { formatPercent } from '@/shared/lib/format';
import { TooltipContent, TooltipTrigger } from '@/shared/ui';

const SERVER_REASON_HEADER = /^\[([^/\]]+)\/([^/\]]+)\/([^\]]+)\]\s*/;
const CALCULATION_SEPARATOR = /\s*\|\s*산식:\s*/;

function formatIntegerQuantity(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? String(Math.round(numericValue)) : value;
}

const CALCULATION_CRITERIA = [
  {
    label: '현재 판매 가능 재고',
    pattern: /판매가능재고|가용재고|on_hand_qty/,
  },
  {
    label: 'D+7·D+14·D+30 누적 수요예측',
    pattern: /D\+7예상잔고|D\+30부족량|예측D(?:7|14|30)/,
  },
  {
    label: '30일 예상 폐기수량·폐기율',
    pattern: /30일예상폐기|예상폐기율/,
  },
  {
    label: '안전재고 기준',
    pattern: /안전재고/,
  },
  {
    label: '소비기한·판매중지·소진 로트',
    pattern: /판매제외LOT|판매 제외 LOT|소비기한|LOT|로트/,
  },
];

/**
 * 서버 산식에 실제로 포함된 기준 데이터만 추려서 표시합니다.
 * 예측이나 안전재고가 없는 평가에 해당 기준을 사용했다고 오해시키지 않습니다.
 */
export function getCalculationCriteria(evidence) {
  if (!evidence) return [];

  return CALCULATION_CRITERIA.filter(({ pattern }) => pattern.test(evidence)).map(({ label }) => label);
}

function formatQuantity(value) {
  return `${formatIntegerQuantity(value)}개`;
}

function inferPrimaryReasonCode(reason) {
  if (/D\+30.*보충 검토|보충 검토/.test(reason)) return 'PREDICTED_SHORTAGE_MONITORING';
  if (/D\+30.*(?:부족|초과)/.test(reason)) return 'PREDICTED_SHORTAGE';
  if (/7일 후 예상 (?:재고|잔고).*안전재고|D\+7 예상잔고.*안전재고/.test(reason)) {
    return 'PROJECTED_UNDER_SAFETY';
  }
  if (/현재 가용재고.*안전재고/.test(reason)) return 'CURRENT_UNDER_SAFETY';
  if (/소비기한/.test(reason)) {
    const days = reason.match(/\((\d+)일 남음\)/)?.[1] ?? reason.match(/소비기한까지 (\d+)일/)?.[1];
    if (days != null) {
      const remainingDays = Number(days);
      if (remainingDays <= 30) return 'EXPIRY_CRITICAL';
      if (remainingDays <= 90) return 'EXPIRY_WARNING';
      if (remainingDays <= 180) return 'EXPIRY_NORMAL';
    }
  }
  if (/판매중지/.test(reason)) return 'LOT_SALE_STOPPED';
  if (/가용재고 데이터가 없|가용재고 정보를 확인할 수 없/.test(reason)) return 'DATA_MISSING';
  if (/판매 가능한 가용재고가 없|가용재고가 0개/.test(reason)) return 'ZERO_AVAILABLE_STOCK';
  if (/수요예측과 안전재고/.test(reason)) return 'FORECAST_WITHOUT_SAFETY_POLICY';
  if (/적정 재고|유효기한 유지 상태|가용재고와 LOT 상태가 양호/.test(reason)) return 'OPTIMAL_STOCK';
  return null;
}

function canonicalPrimaryReason(reason, ruleCode) {
  const resolvedRuleCode = ruleCode || inferPrimaryReasonCode(reason);
  const quantity = reason.match(/\(([-\d.,]+)개 부족(?: 예상)?\)/)?.[1] ?? reason.match(/부족량:\s*([-\d.,]+)개/)?.[1];
  const projectedAndSafety = reason.match(
    /(?:D\+7 예상잔고|7일 후 예상 재고)\(([-\d.,]+)(?:개)?\).*?안전재고\(([-\d.,]+)(?:개)?\)/,
  );
  const currentAndSafety = reason.match(/현재 가용재고\(([-\d.,]+)(?:개)?\).*?안전재고\(([-\d.,]+)(?:개)?\)/);
  const days = reason.match(/\((\d+)일 남음\)/)?.[1] ?? reason.match(/(?:소비기한까지|판매중지일까지) (\d+)일/)?.[1];

  switch (resolvedRuleCode) {
    case 'DATA_MISSING':
      return '현재 가용재고 정보를 확인할 수 없어 부족 위험이 높은 상황입니다.';
    case 'ZERO_AVAILABLE_STOCK':
      return '현재 판매 가능한 가용재고가 없어 부족한 상황입니다.';
    case 'LOT_SALE_STOPPED':
      return '판매중지된 LOT가 있어 판매 가능한 재고가 줄어든 상황입니다.';
    case 'LOT_EXPIRED':
      return '소비기한이 지난 LOT가 있어 판매 가능한 재고가 줄어든 상황입니다.';
    case 'FORECAST_UNAVAILABLE':
      return '수요예측을 확인할 수 없는 상황입니다.';
    case 'FORECAST_INVALID':
      return '수요예측 값이 유효하지 않은 상황입니다.';
    case 'FORECAST_WITHOUT_SAFETY_POLICY':
      return '수요예측과 안전재고 기준이 없어 재고 상태를 확정하기 어려운 상황입니다.';
    case 'PREDICTED_SHORTAGE':
    case 'SHORTAGE_D30':
      return quantity
        ? `D+30 수요예측 기준으로 재고 부족이 예상되는 상황입니다. (${formatQuantity(quantity)} 부족 예상)`
        : 'D+30 수요예측 기준으로 재고 부족이 예상되는 상황입니다.';
    case 'PREDICTED_SHORTAGE_MONITORING':
      return quantity
        ? `D+30 수요예측 기준으로 부족 가능성이 있어 보충 검토가 필요한 상황입니다. (${formatQuantity(quantity)} 부족 예상)`
        : 'D+30 수요예측 기준으로 부족 가능성이 있어 보충 검토가 필요한 상황입니다.';
    case 'PROJECTED_UNDER_SAFETY':
      return projectedAndSafety
        ? `7일 후 예상 재고(${formatQuantity(projectedAndSafety[1])})가 안전재고(${formatQuantity(projectedAndSafety[2])})보다 적어 부족이 예상되는 상황입니다.`
        : '7일 후 예상 재고가 안전재고보다 적어 부족이 예상되는 상황입니다.';
    case 'CURRENT_UNDER_SAFETY':
      return currentAndSafety
        ? `현재 가용재고(${formatQuantity(currentAndSafety[1])})가 안전재고(${formatQuantity(currentAndSafety[2])})보다 적어 부족한 상황입니다.`
        : '현재 가용재고가 안전재고보다 적어 부족한 상황입니다.';
    case 'EXPIRY_CRITICAL':
      return days ? `소비기한까지 ${days}일 남아 기한 내 소진 관리가 필요한 상황입니다.` : reason;
    case 'EXPIRY_WARNING':
      return days ? `소비기한까지 ${days}일 남아 판매·소진 일정 관리가 필요한 상황입니다.` : reason;
    case 'EXPIRY_NORMAL':
      return days ? `소비기한까지 ${days}일 남아 판매·소진 일정 확인이 필요한 상황입니다.` : reason;
    case 'SALE_STOP_CRITICAL':
      return days ? `판매중지일까지 ${days}일 남아 판매·소진 관리가 필요한 상황입니다.` : reason;
    case 'SALE_STOP_WARNING':
      return days ? `판매중지일까지 ${days}일 남아 판매·소진 일정 관리가 필요한 상황입니다.` : reason;
    case 'OPTIMAL_STOCK':
      return '현재 가용재고와 LOT 상태가 양호해 안정적인 재고 상태입니다.';
    default:
      return reason;
  }
}

function translatePrimaryReason(reason, ruleCode) {
  const normalizedReason = reason
    .replace(/판매중지일 도래/g, '판매중지일 임박')
    .replace(/(-?\d+(?:\.\d+)?)(?=개)/g, (_, value) => formatIntegerQuantity(value));

  return canonicalPrimaryReason(normalizedReason, ruleCode);
}

/**
 * 서버가 저장한 산식 문자열을 내부 호환용 한국어 설명으로 변환합니다.
 * 현재 툴팁에는 산식 자체를 노출하지 않고, 실제 사용된 기준 데이터만 표시합니다.
 */
export function translateCalculationEvidence(evidence) {
  if (!evidence) return null;

  return evidence
    .replace(
      /판매가능재고=on_hand_qty\(([^)]+)\)-판매제외LOT\(([^)]+)\)=([^,]+)/g,
      (_, physical, excluded, sellable) =>
        `판매 가능 재고 = 전체 가용 재고 ${formatQuantity(physical)} - 판매 제외 로트 ${formatQuantity(excluded)} = ${formatQuantity(sellable)}`,
    )
    .replace(/가용재고=on_hand_qty\(([^)]+)\)/g, (_, value) => `가용 재고 = 전체 가용 재고 ${formatQuantity(value)}`)
    .replace(/가용재고=([^,]+)/g, (_, value) => `가용 재고 = ${formatQuantity(value)}`)
    .replace(
      /D\+7예상잔고=max\([^)]*\)=([^,]+)/g,
      (_, value) =>
        `7일 후 예상 잔고 = 판매 가능 재고에서 7일 누적 예상 수요를 뺀 값(최소 0개) = ${formatQuantity(value)}`,
    )
    .replace(
      /D\+30부족량=max\([^)]*\)=([^,]+)/g,
      (_, value) =>
        `30일 부족 수량 = 30일 누적 예상 수요에서 판매 가능 재고를 뺀 값(최소 0개) = ${formatQuantity(value)}`,
    )
    .replace(
      /안전재고부족=max\([^)]*\)=([^,]+)/g,
      (_, value) => `안전 재고 부족 = 안전 재고 기준에서 7일 후 예상 잔고를 뺀 값(최소 0개) = ${formatQuantity(value)}`,
    )
    .replace(/30일예상폐기=([^,]+)/g, (_, value) => `30일 예상 폐기수량 = ${formatQuantity(value)}`)
    .replace(
      /예상폐기율=([^,%]+)%/g,
      (_, value) => `예상 폐기율 = ${formatPercent(value, { maximumFractionDigits: 2 })}`,
    )
    .replace(/최근판매종료일=D\+(\d+)/g, (_, value) => `가장 가까운 판매 종료일 = D+${value}`)
    .replace(/판매 제외 LOT=([^,]+)/g, (_, value) => `판매 제외 로트 = ${formatQuantity(value)}`)
    .replace(/소비기한\/LOT 규칙을 함께 적용했습니다\./g, '소비기한·로트 규칙을 함께 적용했습니다.');
}

/**
 * 재고 동기화가 RISK_ASSESSMENT.reason_message에 저장한 판정 문자열을
 * 사용자가 읽기 쉬운 핵심 이유와 판정 기준으로 분리합니다.
 */
export function parseInventoryRiskReason(reason) {
  const normalizedReason = typeof reason === 'string' ? reason.trim() : '';
  if (!normalizedReason) return null;

  const header = normalizedReason.match(SERVER_REASON_HEADER);
  const explanation = header ? normalizedReason.slice(header[0].length) : normalizedReason;
  const [primaryReason, ...calculationParts] = explanation.split(CALCULATION_SEPARATOR);
  const rawCalculationEvidence = calculationParts.join(' | 산식: ').trim();
  const calculationEvidence = translateCalculationEvidence(rawCalculationEvidence);
  const normalizedPrimaryReason = primaryReason.trim() || normalizedReason;

  return {
    ruleVersion: header?.[2] || null,
    ruleCode: header?.[3] || null,
    primaryReason: translatePrimaryReason(normalizedPrimaryReason, header?.[3] || null),
    calculationEvidence: calculationEvidence || null,
    calculationCriteria: getCalculationCriteria(rawCalculationEvidence),
  };
}

/**
 * DB에 저장된 서버 판정 사유를 hover, 키보드 focus, 터치 focus로 확인하는 툴팁입니다.
 */
export function InventoryRiskReasonTooltip({ reason }) {
  const [open, setOpen] = useState(false);
  const explanation = parseInventoryRiskReason(reason);
  if (!explanation) return null;

  const ruleLabel = [explanation.ruleVersion, explanation.ruleCode].filter(Boolean).join(' · ');

  return (
    <TooltipPrimitive.Root open={open} onOpenChange={setOpen}>
      <TooltipTrigger>
        <button
          type="button"
          aria-label="판정 기준 보기"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        >
          <InfoCircle size={15} aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        tone="light"
        side="bottom"
        align="end"
        className="w-[min(22rem,calc(100vw-2rem))] max-w-none space-y-2.5 p-3.5 text-left"
      >
        <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-[var(--border)] pb-2">
          <strong className="text-xs text-gray-900">서버 판정 상세 이유</strong>
          {ruleLabel && <span className="text-[10px] font-medium text-gray-500">규칙 {ruleLabel}</span>}
        </div>

        <div>
          <span className="block text-[10px] font-semibold text-gray-500">핵심 이유</span>
          <p className="mt-0.5 text-xs leading-5 text-gray-800">{explanation.primaryReason}</p>
        </div>

        {explanation.calculationEvidence && (
          <div className="rounded-md bg-gray-50 px-2.5 py-2">
            <span className="block text-[10px] font-semibold text-gray-500">판정 기준</span>
            <p className="mt-0.5 text-[10px] leading-4 text-gray-700">
              {explanation.calculationCriteria.length > 0
                ? `사용 기준 데이터: ${explanation.calculationCriteria.join(', ')}`
                : '서버에 저장된 판정 기준을 확인할 수 있습니다.'}
            </p>
          </div>
        )}

        <p className="text-[10px] leading-4 text-gray-400">
          마지막 재고 동기화에서 서버 규칙으로 판정해 DB에 저장한 결과입니다.
        </p>
      </TooltipContent>
    </TooltipPrimitive.Root>
  );
}
