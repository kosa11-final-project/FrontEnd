import { formatNumber } from '@/shared/lib/format';
import { getPriceStatusLabel } from '@/entities/inventory';

export function SkuChannelPriceTable({ channelPrices = [], isUnassigned = false }) {
  if (isUnassigned) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-medium text-slate-700">판매처 미할당 (센터 보관 재고)</p>
        <p className="mt-0.5 text-[11px] text-slate-400">
          특정 판매처에 귀속되지 않은 센터 전용 재고이므로 판매처별 판매가가 책정되지 않습니다.
        </p>
      </div>
    );
  }

  if (!channelPrices || channelPrices.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-medium text-slate-700">등록된 판매처 가격 정보가 없습니다.</p>
        <p className="mt-0.5 text-[11px] text-slate-400">판매처별 활성 판매가 데이터가 아직 적재되지 않았습니다.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full min-w-[720px] text-left text-xs" aria-label="판매처별 SKU 판매가 표">
        <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
          <tr>
            <th scope="col" className="px-3 py-2">
              판매처
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              현재 판매가
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              정가
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              최저 판매가
            </th>
            <th scope="col" className="px-3 py-2 text-center">
              적용 시작일
            </th>
            <th scope="col" className="px-3 py-2 text-center">
              가격 상태
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {channelPrices.map((price) => {
            const isAvailable = price.priceStatus === 'AVAILABLE';
            const isStale = price.priceStatus === 'STALE';
            const statusLabel = getPriceStatusLabel(price.priceStatus);
            return (
              <tr key={price.salesPointCode} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-3 py-2 font-semibold text-slate-800">
                  {price.salesPointName || price.salesPointCode}
                </td>
                <td className="px-3 py-2 text-right font-bold text-slate-900">
                  {price.sellingPrice != null ? `${formatNumber(price.sellingPrice)}원` : '-'}
                </td>
                <td className="px-3 py-2 text-right text-slate-500">
                  {price.actualPrice != null ? `${formatNumber(price.actualPrice)}원` : '-'}
                </td>
                <td className="px-3 py-2 text-right text-slate-500">
                  {price.minimumSellingPrice != null ? `${formatNumber(price.minimumSellingPrice)}원` : '-'}
                </td>
                <td className="px-3 py-2 text-center text-slate-500">{price.effectiveFrom || '-'}</td>
                <td className="px-3 py-2 text-center">
                  <span
                    className={`rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ${
                      isAvailable
                        ? 'bg-emerald-100 text-emerald-700'
                        : isStale
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {statusLabel}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
