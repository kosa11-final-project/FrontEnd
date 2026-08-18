import { Package } from 'reicon-react';
import { formatDaysRemaining, formatNumber, formatQuantity } from '@/shared/lib/format';
import { StateView } from '@/shared/ui';

/**
 * 재고 상세 LOT 목록 및 FEFO 출고 우선순위 섹션
 * @param {object} props
 * @param {any} [props.selectedSalesPoint] - 선택된 판매처 정보 객체
 * @param {string} [props.selectedSalesPointCode=''] - 선택된 판매처 코드
 * @param {any} props.lotsQuery - LOT 목록 쿼리 객체
 * @param {() => void} [props.onNavigateToOverview]
 */
export function InventoryLotsSection({
  selectedSalesPoint,
  selectedSalesPointCode = '',
  lotsQuery,
  onNavigateToOverview,
}) {
  return (
    <div className="flex-1 flex flex-col bg-[#F9FAFB] overflow-y-auto">
      {/* LOT 패널 헤더 */}
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-white px-5 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="rounded bg-[#DAF7E9] px-2 py-0.5 text-xs font-bold text-[#1E8251]">
            {selectedSalesPoint?.salesPointName || '선택 지점'}
          </span>
          {selectedSalesPoint?.sellingPrice != null && (
            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-700 tabular-nums">
              판매가 {formatNumber(selectedSalesPoint.sellingPrice)}원
            </span>
          )}
          <h3 className="text-xs font-bold text-gray-900">개별 LOT 및 FEFO 출고 우선순위</h3>
        </div>

        <span className="text-xs font-bold text-[#1E8251] tabular-nums">
          총 {(lotsQuery?.data?.items || []).length}개 LOT
        </span>
      </div>

      {/* LOT 목록 */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2.5">
        {!selectedSalesPointCode ? (
          <div className="rounded-xl border border-[var(--border)] bg-white p-8 text-center">
            <Package size={28} className="mx-auto text-gray-300 mb-2" />
            <div className="text-xs font-bold text-gray-700">판매처를 먼저 선택해 주세요</div>
            <p className="mt-1 text-[11px] text-gray-400">
              SKU 행의 판매처를 선택하면 해당 판매처의 LOT와 FEFO 순서를 조회합니다.
            </p>
            <button
              type="button"
              onClick={onNavigateToOverview}
              className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              판매처 선택하기
            </button>
          </div>
        ) : lotsQuery?.isLoading && !lotsQuery?.data ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 w-full animate-pulse rounded-xl bg-gray-200/70" />
            ))}
          </div>
        ) : lotsQuery?.isError ? (
          <div className="rounded-xl border border-[var(--border)] bg-white p-6">
            <StateView
              state="error"
              title="LOT 정보를 불러오지 못했습니다"
              description="서버와의 통신 중 문제가 발생했습니다."
              actionLabel="다시 시도"
              onAction={() => lotsQuery.refetch()}
            />
          </div>
        ) : (lotsQuery?.data?.items || []).length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-white p-8 text-center">
            <Package size={28} className="mx-auto text-gray-300 mb-2" />
            <div className="text-xs font-bold text-gray-700">등록된 LOT 재고가 없습니다</div>
            <p className="mt-1 text-[11px] text-gray-400">
              현재 선택된 {selectedSalesPoint?.salesPointName || '판매처'}에는 활성 LOT가 존재하지 않습니다.
            </p>
          </div>
        ) : (
          (lotsQuery?.data?.items || []).map((lot) => (
            <div
              key={lot.id || lot.lotNumber}
              className="rounded-xl border border-[var(--border)] bg-white p-3.5 shadow-2xs transition-all hover:border-[var(--primary)]/60 hover:shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center rounded bg-[#DAF7E9] px-2 py-0.5 text-[10px] font-extrabold text-[#1E8251]">
                    FEFO {lot.fefoPriority}순위
                  </span>
                  <strong className="text-xs font-bold font-mono text-gray-900">{lot.lotNumber}</strong>
                  {lot.lotStatus && (
                    <span className="rounded bg-gray-100 px-1.5 py-0.2 text-[9px] font-semibold text-gray-600">
                      {lot.lotStatus === 'AVAILABLE' ? '정상' : lot.lotStatus}
                    </span>
                  )}
                </div>

                <div className="text-right shrink-0">
                  {lot.expiryDays != null && (
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-extrabold ${
                        lot.expiryDays <= 7
                          ? 'bg-[#FEE4E2] text-[color:var(--danger)]'
                          : lot.expiryDays <= 30
                            ? 'bg-[#FFF8E6] text-[#B45309]'
                            : 'bg-[#E0F2FE] text-[#0369A1]'
                      }`}
                    >
                      {formatDaysRemaining(lot.expiryDays)}
                    </span>
                  )}
                </div>
              </div>

              {/* 소비기한, 판매중지일시, 보관센터, 입고일자 상세 그리드 */}
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[11px] bg-[#F9FAFB] rounded-lg p-2 border border-gray-100">
                <div className="flex items-center justify-between text-gray-600">
                  <span className="text-gray-400">보관센터</span>
                  <span className="font-semibold text-gray-800 truncate ml-1">
                    {lot.warehouseName || lot.warehouseCode || '미지정'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-gray-600">
                  <span className="text-gray-400">입고일자</span>
                  <span className="font-mono text-gray-700">{lot.receivedDate || '-'}</span>
                </div>

                <div className="flex items-center justify-between text-gray-600">
                  <span className="text-gray-400">소비기한</span>
                  <span className="font-mono font-bold text-gray-900">{lot.expiryDate || '미제공'}</span>
                </div>

                <div className="flex items-center justify-between text-gray-600">
                  <span className="text-gray-400">판매중지일</span>
                  <span className={`font-mono ${lot.saleStopDate ? 'font-bold text-amber-700' : 'text-gray-400'}`}>
                    {lot.saleStopDate || '해당 없음'}
                  </span>
                </div>
              </div>

              {/* 컴팩트 3열 수치 스트립 */}
              <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-gray-100 pt-2 text-center text-xs">
                <div className="rounded bg-gray-50 py-1 px-1.5">
                  <span className="text-[10px] text-gray-500">현재고</span>
                  <div className="font-bold text-gray-900 tabular-nums">{formatQuantity(lot.quantity)}</div>
                </div>
                <div className="rounded bg-[#F0FDF4] py-1 px-1.5">
                  <span className="text-[10px] text-[#1E8251]">가용수량</span>
                  <div className="font-bold text-[#166534] tabular-nums">{formatQuantity(lot.availableQuantity)}</div>
                </div>
                <div className="rounded bg-gray-50 py-1 px-1.5">
                  <span className="text-[10px] text-gray-500">예약수량</span>
                  <div className="font-bold text-gray-600 tabular-nums">{formatQuantity(lot.reservedQuantity)}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
