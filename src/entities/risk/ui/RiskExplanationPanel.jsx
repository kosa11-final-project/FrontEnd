import { useState } from 'react';
import { Danger, HelpCircle } from 'reicon-react';
import { getCalculationCriteria, parseInventoryRiskReason } from '@/entities/inventory';
import { formatDateTime, formatNumber } from '@/shared/lib/format';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui';
import { RiskGradeBadge } from './RiskGradeBadge.jsx';

/**
 * 판정 메시지와 서버 저장 문자열의 소수점 숫자를 정수 단위로 정돈합니다.
 * 사용자가 보는 핵심 사유의 수량 가독성을 유지하고, 내부 문자열 호환도 보장합니다.
 */
function stripSupplementaryNotes(text) {
  if (!text || typeof text !== 'string') return text;
  const stripped = text
    .replace(/\s*수요예측과\s*안전재고\s*기준이\s*없어[^\n.]*상황입니다\.?/g, '')
    .replace(/\s*수요예측을?\s*확인할\s*수\s*없어[^\n.]*상황입니다\.?/g, '')
    .replace(/\s*수요예측\s*기준일이\s*오래되어[^\n.]*상황입니다\.?/g, '')
    .replace(/\s*수요예측\s*값이\s*유효하지\s*않아[^\n.]*상황입니다\.?/g, '')
    .replace(/\s*수요예측을?\s*확인할\s*수\s*없는\s*상황입니다\.?/g, '')
    .replace(/\s*안전재고\s*기준이\s*없어[^\n.]*상황입니다\.?/g, '')
    .trim();
  return /^(?:수요예측과?|안전재고)$/.test(stripped) ? '' : stripped;
}

function legacyMetricReason(availableQty, expectedDisposalQty30) {
  if (availableQty != null && expectedDisposalQty30 != null) {
    return `현재 판매 가능 재고는 ${formatNumber(availableQty)}개이며, 30일 예상 폐기수량은 ${formatNumber(expectedDisposalQty30)}개입니다.`;
  }
  if (availableQty != null) {
    return `현재 판매 가능 재고는 ${formatNumber(availableQty)}개입니다.`;
  }
  if (expectedDisposalQty30 != null) {
    return `30일 예상 폐기수량은 ${formatNumber(expectedDisposalQty30)}개입니다.`;
  }
  return '현재 확인 가능한 재고 기준으로 판정했습니다.';
}

function cleanDecimalsInText(text) {
  if (!text || typeof text !== 'string') return text;
  return text.replace(/(\d+)\.(\d+)/g, (match, _integer, _fraction, offset, source) => {
    const num = parseFloat(match);
    const suffix = source.slice(offset + match.length);
    if (/^\s*%/.test(suffix)) {
      return Number.isFinite(num) ? num.toLocaleString('ko-KR', { maximumFractionDigits: 2 }) : match;
    }
    return isNaN(num) ? match : Math.round(num).toLocaleString();
  });
}

function getLiveAssessmentCriteria({
  availableQty,
  shortageQty30,
  projectedD7,
  safetyStockQty,
  expectedDisposalQty30,
  expectedDisposalRate30,
  nearestSaleEndDays,
}) {
  const criteria = [];

  if (availableQty != null) {
    criteria.push('현재 판매 가능 재고');
  }
  if (shortageQty30 != null || projectedD7 != null) {
    criteria.push('D+7·D+14·D+30 누적 수요예측');
  }
  if (expectedDisposalQty30 != null || expectedDisposalRate30 != null) {
    criteria.push('30일 예상 폐기수량·폐기율');
  }
  if (safetyStockQty != null) {
    criteria.push('안전재고 기준');
  }
  if (expectedDisposalQty30 != null || nearestSaleEndDays != null) {
    criteria.push('소비기한·판매중지·소진 로트');
  }

  return criteria;
}

function isCanonicalReasonVersion(ruleVersion) {
  const match = typeof ruleVersion === 'string' && ruleVersion.match(/^v(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return false;
  const [, major, minor] = match;
  return Number(major) > 1 || (Number(major) === 1 && Number(minor) >= 7);
}

/**
 * 위험도 평가 상세 설명 및 근거 패널 컴포넌트
 * @param {object} props
 * @param {Record<string, any> | null} props.data - 위험도 평가 뷰 모델 데이터
 * @param {number | null} props.expectedDisposalQuantity - 선택한 판매처 기준 향후 30일 예상 폐기수량
 */
export function RiskExplanationPanel({ data, expectedDisposalQuantity = null }) {
  const [calculationOpen, setCalculationOpen] = useState(false);

  if (!data) return null;

  const {
    assessmentStatus,
    riskGrade,
    reasonMessage,
    ruleVersion,
    assessedAt,
    baseDate,
    availableQty,
    safetyStockQty,
    stockCoverageDays,
    shortageYn,
    expectedDisposalQty30,
    expectedDisposalRate30,
    nearestSaleEndDays,
    reasons = [],
  } = data;
  const resolvedExpectedDisposalQuantity =
    expectedDisposalQty30 != null ? expectedDisposalQty30 : expectedDisposalQuantity;

  const canonicalReason = isCanonicalReasonVersion(ruleVersion);
  const parsedReason = canonicalReason ? null : parseInventoryRiskReason(reasonMessage);
  const actionableReasonItem = canonicalReason
    ? null
    : reasons.find((r) => r.severity === 'CRITICAL' || r.severity === 'WARNING') ||
      reasons.find((r) => r.severity !== 'INFO' && r.severity !== 'GOOD');
  const rawTargetText = actionableReasonItem
    ? actionableReasonItem.code && !actionableReasonItem.message.startsWith('[ASSESSED')
      ? `[ASSESSED/v1.0.0/${actionableReasonItem.code}] ${actionableReasonItem.message}`
      : actionableReasonItem.message
    : reasonMessage;
  const parsedTargetReason = canonicalReason ? null : parseInventoryRiskReason(rawTargetText);
  const candidateReason = canonicalReason
    ? reasonMessage
    : parsedTargetReason?.primaryReason ||
      parsedReason?.primaryReason ||
      actionableReasonItem?.message ||
      reasonMessage;
  // v1.7+ reason_message는 서버가 완성한 canonical 문장입니다. 숫자 반올림·문장 선택·영문
  // evidence 제거를 프론트에서 다시 수행하면 저장 스냅샷과 화면이 갈라지므로 그대로 렌더링합니다.
  const normalizedLegacyReason = cleanDecimalsInText(stripSupplementaryNotes(candidateReason));
  const primaryReason = canonicalReason
    ? candidateReason || '서버에 저장된 핵심 사유가 없습니다.'
    : normalizedLegacyReason || legacyMetricReason(availableQty, resolvedExpectedDisposalQuantity);
  const calculationEvidence = canonicalReason ? null : cleanDecimalsInText(parsedReason?.calculationEvidence);
  const storedCalculationCriteria = canonicalReason
    ? []
    : (parsedReason?.calculationCriteria ?? getCalculationCriteria(calculationEvidence));
  const liveCalculationCriteria = getLiveAssessmentCriteria({
    availableQty,
    shortageQty30: data.shortageQty30,
    projectedD7: data.projectedD7,
    safetyStockQty,
    expectedDisposalQty30,
    expectedDisposalRate30,
    nearestSaleEndDays,
  });
  const calculationCriteria =
    storedCalculationCriteria.length > 0 ? storedCalculationCriteria : liveCalculationCriteria;
  const resolvedShortageYn = canonicalReason
    ? shortageYn
    : (shortageYn ??
      (availableQty == null || availableQty === 0
        ? 'Y'
        : safetyStockQty == null
          ? null
          : availableQty < safetyStockQty
            ? 'Y'
            : 'N'));
  const safetyStockDelta =
    availableQty != null && safetyStockQty != null ? Number(availableQty) - Number(safetyStockQty) : null;
  const hasSafetyStockDelta = Number.isFinite(safetyStockDelta);

  return (
    <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
      {/* 1. 상단 종합 위험 판정 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800">서버 위험 판정 결과</span>
          {calculationCriteria.length > 0 && (
            <Tooltip open={calculationOpen} onOpenChange={setCalculationOpen}>
              <TooltipTrigger>
                <button
                  type="button"
                  aria-label="판정 기준 보기"
                  aria-expanded={calculationOpen}
                  onClick={() => setCalculationOpen((current) => !current)}
                  className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                >
                  <HelpCircle size={14} aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                tone="light"
                side="bottom"
                align="start"
                className="w-[min(24rem,calc(100vw-2rem))] max-w-none text-left"
              >
                <span className="block text-[10px] font-semibold text-slate-500">판정 기준</span>
                <p className="mt-0.5 text-[11px] leading-4 text-slate-700">
                  {calculationCriteria.length > 0
                    ? `사용 기준 데이터: ${calculationCriteria.join(', ')}`
                    : '서버에 저장된 판정 기준을 확인할 수 있습니다.'}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
          <RiskGradeBadge grade={riskGrade} status={assessmentStatus} showStatus showDot={false} />
          {assessmentStatus === 'ASSESSED' && (
            <span className="text-[10px] font-medium text-slate-400">동기화 판정 기준</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          {baseDate && <span>기준일 {baseDate}</span>}
          {assessedAt && <span>판정시각 {formatDateTime(assessedAt)}</span>}
        </div>
      </div>

      {/* 2. 주요 판정 사유 (핵심 사유 단일 표시) */}
      <div
        data-testid="risk-primary-reason"
        className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700"
      >
        <Danger size={15} className="mt-0.5 shrink-0 text-slate-500" />
        <div className="flex-1">
          <span className="font-semibold text-slate-900">핵심 사유: </span>
          <span>{primaryReason}</span>
        </div>
      </div>

      <div className="mb-1 text-[10px] font-semibold text-slate-400">현재 조회 기준</div>
      <div data-testid="risk-metric-grid" className="grid grid-cols-3 gap-1.5">
        <div className="min-w-0 rounded-lg border border-indigo-100 bg-indigo-50/40 px-2 py-1.5">
          <div className="whitespace-nowrap text-[10px] text-indigo-600">예상 보유일</div>
          <div className="mt-1 whitespace-nowrap text-xs font-bold text-indigo-700">
            {stockCoverageDays != null ? `${formatNumber(stockCoverageDays)}일` : '산정 불가'}
          </div>
          {stockCoverageDays != null && (
            <div className="mt-0.5 whitespace-nowrap text-[9px] text-indigo-500">30일 평균 수요 기준</div>
          )}
        </div>
        <div
          className={`min-w-0 rounded-lg border px-2 py-1.5 ${
            resolvedShortageYn === 'Y'
              ? 'border-rose-100 bg-rose-50/40'
              : resolvedShortageYn === 'N'
                ? 'border-emerald-100 bg-emerald-50/40'
                : 'border-slate-100 bg-slate-50/50'
          }`}
        >
          <div
            className={`whitespace-nowrap text-[10px] ${
              resolvedShortageYn === 'Y'
                ? 'text-rose-600'
                : resolvedShortageYn === 'N'
                  ? 'text-emerald-600'
                  : 'text-slate-500'
            }`}
          >
            안전재고 충족
          </div>
          <div className="mt-0.5 whitespace-nowrap text-[9px] text-slate-400">
            안전재고 기준 {safetyStockQty != null ? `${formatNumber(safetyStockQty)}개` : '산정 불가'}
          </div>
          <div
            className={`mt-1 whitespace-nowrap text-xs font-bold ${
              resolvedShortageYn === 'Y'
                ? 'text-rose-700'
                : resolvedShortageYn === 'N'
                  ? 'text-emerald-700'
                  : 'text-slate-400'
            }`}
          >
            {resolvedShortageYn === 'Y' ? '부족' : resolvedShortageYn === 'N' ? '충족' : '판정 불가'}
          </div>
          {hasSafetyStockDelta && (
            <div
              className={`mt-0.5 whitespace-nowrap text-[9px] font-semibold ${
                safetyStockDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {safetyStockDelta >= 0
                ? `+${formatNumber(safetyStockDelta)}개 충족`
                : `${formatNumber(safetyStockDelta)}개 부족`}
            </div>
          )}
        </div>
        <div className="min-w-0 rounded-lg border border-amber-100 bg-amber-50/40 px-2 py-1.5">
          <div className="whitespace-nowrap text-[10px] text-amber-700">30일 예상 폐기</div>
          <div className="mt-1 whitespace-nowrap text-xs font-bold tabular-nums text-amber-800">
            {resolvedExpectedDisposalQuantity != null
              ? `${formatNumber(resolvedExpectedDisposalQuantity)}개`
              : '산정 불가'}
          </div>
          <div className="mt-0.5 whitespace-nowrap text-[9px] text-amber-600">
            {expectedDisposalRate30 != null && nearestSaleEndDays != null
              ? `폐기율 ${formatNumber(expectedDisposalRate30, { maximumFractionDigits: 2 })}% · 종료까지 ${formatNumber(nearestSaleEndDays)}일`
              : expectedDisposalRate30 != null
                ? `폐기율 ${formatNumber(expectedDisposalRate30, { maximumFractionDigits: 2 })}%`
                : nearestSaleEndDays != null
                  ? `판매 종료까지 ${formatNumber(nearestSaleEndDays)}일`
                  : '향후 30일 기준'}
          </div>
        </div>
      </div>
    </div>
  );
}
