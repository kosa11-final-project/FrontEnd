import { formatNumber } from '@/shared/lib/format';

/**
 * 수요예측 및 구간별 예상 잔고 테이블 컴포넌트
 * @param {object} props
 * @param {import('../model/forecast.js').DemandForecastDetail | null} props.data - 수요예측 응답 뷰 모델
 */
export function DemandForecastTable({ data }) {
  if (!data) return null;

  const { cumulativeForecast, projectedInventories, safetyStockQty } = data;
  const hasSafetyStock = safetyStockQty != null;
  const horizonRows = [
    ['D+7 (1주)', cumulativeForecast?.predictedQtyD7, projectedInventories?.projectedD7],
    ['D+14 (2주)', cumulativeForecast?.predictedQtyD14, projectedInventories?.projectedD14],
    ['D+30 (1개월)', cumulativeForecast?.predictedQtyD30, projectedInventories?.projectedD30],
    ['D+60 (2개월)', cumulativeForecast?.predictedQtyD60, projectedInventories?.projectedD60],
    ['D+90 (3개월)', cumulativeForecast?.predictedQtyD90, projectedInventories?.projectedD90],
  ].map(([horizon, forecastQty, projectedQty]) => ({ horizon, forecastQty, projectedQty }));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 text-xs text-slate-600" aria-label="수요예측 기준 요약">
        <span>
          현재 가용재고: <strong className="text-slate-900">{formatNumber(data.availableQty)}개</strong>
        </span>
        <span>
          안전재고 기준:{' '}
          <strong className={hasSafetyStock ? 'text-rose-600' : 'text-slate-500'}>
            {hasSafetyStock ? `${formatNumber(safetyStockQty)}개` : '미적재'}
          </strong>
        </span>
        {projectedInventories?.stockoutPeriod && <span>예상 소진 구간: {projectedInventories.stockoutPeriod}</span>}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[560px] text-left text-xs" aria-label="기간별 수요예측 및 예상 잔고 표">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
            <tr>
              <th scope="col" className="px-3 py-2">
                예측 시점
              </th>
              <th scope="col" className="px-3 py-2 text-right">
                누적 예측수요
              </th>
              <th scope="col" className="px-3 py-2 text-right">
                예상 가용재고
              </th>
              <th scope="col" className="px-3 py-2 text-center">
                안전재고 대비
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {horizonRows.map((row) => {
              const isUnderSafety = hasSafetyStock && row.projectedQty != null && row.projectedQty < safetyStockQty;
              const isDepleted = row.projectedQty != null && row.projectedQty <= 0;
              return (
                <tr key={row.horizon} className="transition-colors hover:bg-slate-50/50">
                  <th scope="row" className="px-3 py-2 font-semibold text-slate-700">
                    {row.horizon}
                  </th>
                  <td className="px-3 py-2 text-right font-semibold text-amber-600">
                    {row.forecastQty != null ? `${formatNumber(row.forecastQty)}개` : '-'}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-bold ${isDepleted ? 'text-rose-600' : isUnderSafety ? 'text-amber-600' : 'text-emerald-600'}`}
                  >
                    {row.projectedQty != null ? `${formatNumber(row.projectedQty)}개` : '-'}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {!hasSafetyStock ? (
                      <span className="text-slate-400">기준 미적재</span>
                    ) : row.projectedQty == null ? (
                      <span className="text-slate-400">-</span>
                    ) : isDepleted ? (
                      <span className="inline-flex rounded-sm bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                        재고 소진
                      </span>
                    ) : isUnderSafety ? (
                      <span className="inline-flex rounded-sm bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                        안전재고 미달
                      </span>
                    ) : (
                      <span className="inline-flex rounded-sm bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        안전 확보
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
