import { CheckCircle, Danger, Package, Warning } from 'reicon-react';
import { formatDaysRemaining, formatQuantity } from '@/shared/lib/format';
import { InventoryRiskReasonTooltip, InventoryStatusBadge } from '@/entities/inventory';
import { getAssessmentStatusLabel } from '@/entities/risk';

/**
 * 재고 상세 상단 핵심 4대 KPI 리본 영역
 * @param {object} props
 * @param {import('@/entities/inventory').InventoryItem} props.item
 * @param {boolean} [props.showRisk=true] - 위험도 카드 노출 여부
 */
export function InventoryDetailKpiRibbon({ item, showRisk = true }) {
  return (
    <section
      className={`grid grid-cols-2 ${showRisk ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-2.5 bg-[#F9FAFB] border-b border-[var(--border)] px-6 py-2.5 shrink-0`}
    >
      <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-white px-3 py-2 shadow-2xs">
        <div>
          <span className="text-[10px] font-semibold text-gray-500">총 현재고</span>
          <div className="text-sm font-extrabold text-gray-900 tabular-nums">
            {formatQuantity(item.currentQuantity)}
          </div>
        </div>
        <Package size={18} className="text-gray-400 shrink-0" />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-[#B7ECCF] bg-[#F0FDF4] px-3 py-2 shadow-2xs">
        <div>
          <span className="text-[10px] font-semibold text-[#1E8251]">가용수량</span>
          <div className="text-sm font-extrabold text-[#166534] tabular-nums">
            {formatQuantity(item.availableQuantity)}{' '}
            <span className="text-[10px] font-normal text-[#1E8251]">
              (예약 {formatQuantity(item.reservedQuantity)} · 안전 {formatQuantity(item.safetyQuantity)})
            </span>
          </div>
        </div>
        <CheckCircle size={18} className="text-[color:var(--primary)] shrink-0" />
      </div>

      {showRisk && (
        <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-white px-3 py-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-semibold text-gray-500">위험 판정</span>
              <InventoryRiskReasonTooltip reason={item.riskReason} />
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
              <InventoryStatusBadge status={item.riskGrade} />
              <span className="text-[10px] font-medium text-gray-500">
                {getAssessmentStatusLabel(item.assessmentStatus)}
              </span>
            </div>
          </div>
          {item.riskGrade === 'DANGER' ? (
            <Danger size={18} className="text-red-500 shrink-0" />
          ) : item.riskGrade === 'CAUTION' ? (
            <Warning size={18} className="text-amber-500 shrink-0" />
          ) : (
            <CheckCircle size={18} className="text-[color:var(--primary)] shrink-0" />
          )}
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-white px-3 py-2 shadow-2xs">
        <div>
          <span className="text-[10px] font-semibold text-gray-500">FEFO 소비기한</span>
          <div className="mt-0.5 flex items-center gap-1.5">
            {item.nearestExpiryDays != null ? (
              <span
                className={`rounded px-1.5 py-0.2 text-xs font-extrabold ${
                  item.nearestExpiryDays <= 7
                    ? 'bg-[#FEE4E2] text-[color:var(--danger)]'
                    : item.nearestExpiryDays <= 30
                      ? 'bg-[#FFF8E6] text-[#B45309]'
                      : 'bg-[#E0F2FE] text-[#0369A1]'
                }`}
              >
                {formatDaysRemaining(item.nearestExpiryDays)}
              </span>
            ) : (
              <span className="text-xs text-gray-400">미제공</span>
            )}
            {item.nearestExpiryDate && (
              <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">{item.nearestExpiryDate}</span>
            )}
          </div>
        </div>
        <span className="text-[10px] font-bold text-gray-400 shrink-0">
          {item.lotCount != null ? `LOT ${item.lotCount}` : ''}
        </span>
      </div>
    </section>
  );
}
