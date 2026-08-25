import { useState } from 'react';
import { Danger, HelpCircle } from 'reicon-react';
import { parseInventoryRiskReason } from '@/entities/inventory';
import { getRiskReasonSeverityLabel } from '@/entities/risk';
import { formatDateTime, formatNumber } from '@/shared/lib/format';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui';
import { RiskGradeBadge } from './RiskGradeBadge.jsx';

/**
 * 판정 메시지 및 증거 내 소수점 숫자를 정수 단위로 가독성 높게 정돈합니다.
 * 예: 171.464개 -> 171개, projectedD7=28.72 -> projectedD7=29
 */
function cleanDecimalsInText(text) {
  if (!text || typeof text !== 'string') return text;
  return text.replace(/(\d+)\.(\d+)/g, (match) => {
    const num = parseFloat(match);
    return isNaN(num) ? match : Math.round(num).toLocaleString();
  });
}

/**
 * 위험도 평가 상세 설명 및 근거 패널 컴포넌트
 * @param {object} props
 * @param {Record<string, any> | null} props.data - 위험도 평가 뷰 모델 데이터
 */
export function RiskExplanationPanel({ data }) {
  const [calculationOpen, setCalculationOpen] = useState(false);

  if (!data) return null;

  const {
    assessmentStatus,
    riskGrade,
    reasonMessage,
    assessedAt,
    baseDate,
    availableQty,
    safetyStockQty,
    stockCoverageDays,
    shortageYn,
    reasons = [],
  } = data;

  const parsedReason = parseInventoryRiskReason(reasonMessage);
  const primaryReason = cleanDecimalsInText(parsedReason?.primaryReason || reasonMessage);
  const calculationEvidence = cleanDecimalsInText(parsedReason?.calculationEvidence);
  const resolvedShortageYn =
    shortageYn ??
    (availableQty == null || availableQty === 0
      ? 'Y'
      : safetyStockQty == null
        ? null
        : availableQty < safetyStockQty
          ? 'Y'
          : 'N');
  const safetyStockDelta =
    availableQty != null && safetyStockQty != null ? Number(availableQty) - Number(safetyStockQty) : null;
  const hasSafetyStockDelta = Number.isFinite(safetyStockDelta);

  return (
    <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
      {/* 1. 상단 종합 위험 판정 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800">서버 위험 판정 결과</span>
          {calculationEvidence && (
            <Tooltip open={calculationOpen} onOpenChange={setCalculationOpen}>
              <TooltipTrigger>
                <button
                  type="button"
                  aria-label="계산 근거 보기"
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
                <span className="block text-[10px] font-semibold text-slate-500">계산 근거</span>
                <p className="mt-0.5 break-words text-[11px] leading-4 text-slate-700">{calculationEvidence}</p>
              </TooltipContent>
            </Tooltip>
          )}
          <RiskGradeBadge grade={riskGrade} status={assessmentStatus} showStatus showDot={false} />
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          {baseDate && <span>기준일 {baseDate}</span>}
          {assessedAt && <span>판정시각 {formatDateTime(assessedAt)}</span>}
        </div>
      </div>

      {/* 2. 주요 판정 사유 */}
      <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700">
        <Danger size={15} className="mt-0.5 shrink-0 text-slate-500" />
        <div className="flex-1">
          <span className="font-semibold text-slate-900">핵심 사유: </span>
          <span>{primaryReason}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 px-2.5 py-2">
          <div className="text-[11px] text-indigo-600">예상 보유 가능 일수</div>
          <div className="mt-1 text-sm font-bold text-indigo-700">
            {stockCoverageDays != null ? `${formatNumber(stockCoverageDays)}일` : '산정 불가'}
          </div>
          {stockCoverageDays != null && <div className="mt-0.5 text-[10px] text-indigo-500">30일 평균 수요 기준</div>}
        </div>
        <div
          className={`rounded-lg border px-2.5 py-2 ${
            resolvedShortageYn === 'Y'
              ? 'border-rose-100 bg-rose-50/40'
              : resolvedShortageYn === 'N'
                ? 'border-emerald-100 bg-emerald-50/40'
                : 'border-slate-100 bg-slate-50/50'
          }`}
        >
          <div
            className={`text-[11px] ${
              resolvedShortageYn === 'Y'
                ? 'text-rose-600'
                : resolvedShortageYn === 'N'
                  ? 'text-emerald-600'
                  : 'text-slate-500'
            }`}
          >
            재고 부족 여부
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">
            안전재고 기준 {safetyStockQty != null ? `${formatNumber(safetyStockQty)}개` : '산정 불가'}
          </div>
          <div
            className={`mt-1 text-sm font-bold ${
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
              className={`mt-0.5 text-[10px] font-semibold ${
                safetyStockDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {safetyStockDelta >= 0
                ? `+${formatNumber(safetyStockDelta)}개 충족`
                : `${formatNumber(safetyStockDelta)}개 부족`}
            </div>
          )}
        </div>
      </div>

      {/* 3. 세부 평가 사유 목록 (Reasons) */}
      {reasons && reasons.length > 0 && (
        <div className="space-y-1.5 border-t border-slate-100 pt-2 text-xs">
          <h5 className="text-[11px] font-bold text-slate-500">세부 평가 내역 ({reasons.length}건)</h5>
          <div className="space-y-1">
            {reasons.map((r, i) => {
              const isCritical = r.severity === 'CRITICAL';
              const isWarning = r.severity === 'WARNING';
              const badgeClass = isCritical
                ? 'bg-rose-100 text-rose-700'
                : isWarning
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-700';

              return (
                <div
                  key={`${r.code}-${i}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-2.5 py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-bold ${badgeClass}`}>
                      {getRiskReasonSeverityLabel(r.severity)}
                    </span>
                    <span className="text-slate-800">{cleanDecimalsInText(r.message)}</span>
                  </div>
                  {r.evidence && (
                    <span className="text-[10px] text-slate-400 font-mono break-all">
                      {cleanDecimalsInText(r.evidence)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
