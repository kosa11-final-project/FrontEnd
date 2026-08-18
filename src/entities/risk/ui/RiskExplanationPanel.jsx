import { Danger } from 'reicon-react';
import { formatDateTime, formatNumber } from '@/shared/lib/format';
import { RiskGradeBadge } from './RiskGradeBadge.jsx';

/**
 * 위험도 평가 상세 설명 및 근거 패널 컴포넌트
 * @param {object} props
 * @param {Record<string, any> | null} props.data - 위험도 평가 뷰 모델 데이터
 */
export function RiskExplanationPanel({ data }) {
  if (!data) return null;

  const {
    assessmentStatus,
    riskGrade,
    reasonMessage,
    ruleVersion,
    assessedAt,
    baseDate,
    availableQty,
    projectedD7,
    shortageQty30,
    safetyGapQty,
    safetyStockQty,
    nearestExpiryDays,
    reasons = [],
  } = data;

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      {/* 1. 상단 종합 위험 판정 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800">서버 위험 판정 결과</span>
          <RiskGradeBadge grade={riskGrade} status={assessmentStatus} showStatus />
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          {ruleVersion && <span>규칙 {ruleVersion}</span>}
          {baseDate && <span>• 기준일 {baseDate}</span>}
          {assessedAt && <span>• 판정시각 {formatDateTime(assessedAt)}</span>}
        </div>
      </div>

      {/* 2. 주요 판정 사유 */}
      <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700">
        <Danger size={15} className="mt-0.5 shrink-0 text-slate-500" />
        <div className="flex-1">
          <span className="font-semibold text-slate-900">핵심 사유: </span>
          <span>{reasonMessage}</span>
        </div>
      </div>

      {/* 3. 판정 수치 근거 메트릭 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1">
        <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5">
          <div className="text-[11px] text-slate-500">현재 가용재고</div>
          <div className="mt-1 text-sm font-bold text-slate-900">
            {availableQty != null ? `${formatNumber(availableQty)}개` : '판정 불가'}
          </div>
        </div>

        <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5">
          <div className="text-[11px] text-slate-500">D+7 예상 잔고</div>
          <div className="mt-1 text-sm font-bold text-slate-900">
            {projectedD7 != null ? `${formatNumber(projectedD7)}개` : '판정 불가'}
          </div>
        </div>

        <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5">
          <div className="text-[11px] text-slate-500">D+30 예상 부족량</div>
          <div
            className={`mt-1 text-sm font-bold ${
              shortageQty30 == null ? 'text-slate-400' : shortageQty30 > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {shortageQty30 == null
              ? '판정 불가'
              : shortageQty30 > 0
                ? `${formatNumber(shortageQty30)}개`
                : '0개 (충족)'}
          </div>
        </div>

        <div className="rounded-lg border border-rose-100 bg-rose-50/40 p-2.5">
          <div className="text-[11px] text-rose-600">안전재고 기준</div>
          <div className="mt-1 text-sm font-bold text-rose-700">
            {safetyStockQty != null ? `${formatNumber(safetyStockQty)}개` : '판정 불가'}
          </div>
        </div>

        <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5">
          <div className="text-[11px] text-slate-500">가장 가까운 소비기한</div>
          <div
            className={`mt-1 text-sm font-bold ${
              nearestExpiryDays != null && nearestExpiryDays <= 30
                ? 'text-rose-600'
                : nearestExpiryDays != null && nearestExpiryDays <= 90
                  ? 'text-amber-600'
                  : 'text-slate-900'
            }`}
          >
            {nearestExpiryDays != null ? `${nearestExpiryDays}일 남음` : '-'}
          </div>
        </div>
      </div>

      {/* 4. 안전재고 미달 경고 */}
      {safetyGapQty != null && safetyGapQty > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
          안전재고 목표치 대비 <strong className="font-bold">{formatNumber(safetyGapQty)}개</strong> 부족 상태입니다.
        </div>
      )}

      {/* 5. 세부 평가 사유 목록 (Reasons) */}
      {reasons && reasons.length > 0 && (
        <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-2 text-xs">
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
                    <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-bold ${badgeClass}`}>{r.severity}</span>
                    <span className="text-slate-800">{r.message}</span>
                  </div>
                  {r.evidence && <span className="text-[10px] text-slate-400 font-mono break-all">{r.evidence}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
