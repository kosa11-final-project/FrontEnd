import { useState } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { InfoCircle } from 'reicon-react';
import { TooltipContent, TooltipTrigger } from '@/shared/ui';

const SERVER_REASON_HEADER = /^\[([^/\]]+)\/([^/\]]+)\/([^\]]+)\]\s*/;
const CALCULATION_SEPARATOR = /\s*\|\s*산식:\s*/;

function formatIntegerQuantity(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? String(Math.round(numericValue)) : value;
}

function translatePrimaryReason(reason) {
  return reason.replace(/(-?\d+(?:\.\d+)?)(?=개)/g, (_, value) => formatIntegerQuantity(value));
}

/**
 * 서버가 저장한 수식은 판정 재현에 필요한 식별자 중심의 형식이므로,
 * 툴팁에서는 같은 값을 사용자가 바로 이해할 수 있는 한국어로 보여줍니다.
 */
export function translateCalculationEvidence(evidence) {
  if (!evidence) return null;

  return evidence
    .replace(/가용재고=on_hand_qty\(([^)]+)\)/g, (_, value) => `가용 재고: ${formatIntegerQuantity(value)}개`)
    .replace(/가용재고=([^,]+)/g, (_, value) => `가용 재고: ${formatIntegerQuantity(value)}개`)
    .replace(/D\+7예상잔고=max\([^)]*\)=([^,]+)/g, (_, value) => `7일 후 예상 잔고: ${formatIntegerQuantity(value)}개`)
    .replace(/D\+30부족량=max\([^)]*\)=([^,]+)/g, (_, value) => `30일 부족 수량: ${formatIntegerQuantity(value)}개`)
    .replace(/안전재고부족=max\([^)]*\)=([^,]+)/g, (_, value) => `안전 재고 부족: ${formatIntegerQuantity(value)}개`)
    .replace(/소비기한\/LOT 규칙을 함께 적용했습니다\./g, '소비기한과 로트 규칙도 함께 적용했습니다.');
}

/**
 * 재고 동기화가 RISK_ASSESSMENT.reason_message에 저장한 판정 문자열을
 * 사용자가 읽기 쉬운 핵심 이유와 보조 계산 근거로 분리합니다.
 */
export function parseInventoryRiskReason(reason) {
  const normalizedReason = typeof reason === 'string' ? reason.trim() : '';
  if (!normalizedReason) return null;

  const header = normalizedReason.match(SERVER_REASON_HEADER);
  const explanation = header ? normalizedReason.slice(header[0].length) : normalizedReason;
  const [primaryReason, ...calculationParts] = explanation.split(CALCULATION_SEPARATOR);
  const calculationEvidence = translateCalculationEvidence(calculationParts.join(' | 산식: ').trim());
  const normalizedPrimaryReason = primaryReason.trim() || normalizedReason;

  return {
    ruleVersion: header?.[2] || null,
    ruleCode: header?.[3] || null,
    primaryReason: translatePrimaryReason(normalizedPrimaryReason),
    calculationEvidence: calculationEvidence || null,
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
          aria-label="재고 위험 판정 이유 보기"
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
            <span className="block text-[10px] font-semibold text-gray-500">계산 근거</span>
            <p className="mt-0.5 break-words font-sans text-[10px] leading-4 text-gray-600">
              {explanation.calculationEvidence}
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
