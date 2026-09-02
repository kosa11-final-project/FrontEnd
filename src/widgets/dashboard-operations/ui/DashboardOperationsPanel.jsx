import { AlertTriangle, ChevronDown, Store } from 'reicon-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/ui/Accordion.jsx';
import { Card } from '@/shared/ui/Card.jsx';
import { Icon } from '@/shared/ui/Icon.jsx';
import { RiskSalesPointTable } from '@/widgets/risk-sales-points/ui/RiskSalesPointTable.jsx';
import { UrgentSkuList } from '@/widgets/urgent-skus/ui/UrgentSkuList.jsx';

export function DashboardOperationsPanel({ accordionResetKey = 0, selectedSalesPoint, urgentSkus, riskSalesPoints }) {
  const showUrgentSection = Boolean(selectedSalesPoint);
  const accordionDefaultValue = showUrgentSection ? ['urgent', 'risk'] : ['risk'];
  const urgentDescription = selectedSalesPoint
    ? `${selectedSalesPoint.name} 기준 · 위험등급·예상 폐기수량 기준 우선 조치`
    : '판매처를 선택하면 해당 판매처의 긴급 처리 대상을 표시합니다.';

  return (
    <Card asChild padding="none" className="h-full min-w-0 overflow-hidden shadow-[var(--shadow-soft)]">
      <section className="flex h-full min-h-0 flex-col" aria-label="판매처 재고 운영 정보">
        <Accordion
          key={`${showUrgentSection ? 'seller' : 'unassigned'}-${accordionResetKey}`}
          multiple
          defaultValue={accordionDefaultValue}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          {showUrgentSection ? (
            <AccordionItem value="urgent">
              <AccordionTrigger>
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-[17px] font-[var(--font-weight-bold)] leading-[var(--line-height-heading)] text-[color:var(--text-heading)]">
                    <Icon
                      icon={AlertTriangle}
                      size={18}
                      className="shrink-0 text-[color:var(--danger)]"
                      aria-hidden="true"
                    />
                    긴급 처리 SKU TOP 5
                  </span>
                  <span className="mt-1 block truncate text-[13px] font-normal leading-[var(--line-height-body)] text-[color:var(--text-body)]">
                    {urgentDescription}
                  </span>
                </span>
                <Icon
                  icon={ChevronDown}
                  size={18}
                  className="shrink-0 text-[color:var(--text-muted)] transition-transform group-data-[state=open]:rotate-180"
                  aria-hidden="true"
                />
              </AccordionTrigger>
              <AccordionContent>
                <UrgentSkuList
                  compact
                  embedded
                  hideHeader
                  skus={urgentSkus}
                  emptyTitle="긴급 처리 대상 SKU가 없습니다."
                  emptyDescription={`${selectedSalesPoint.name}에 긴급 처리 대상 SKU가 없습니다.`}
                />
              </AccordionContent>
            </AccordionItem>
          ) : null}
          <AccordionItem value="risk">
            <AccordionTrigger>
              <span className="min-w-0">
                <span className="flex items-center gap-2 whitespace-nowrap text-[15px] font-[var(--font-weight-bold)] leading-tight text-[color:var(--text-heading)] sm:text-[17px] sm:leading-[var(--line-height-heading)]">
                  <Icon icon={Store} size={18} className="shrink-0 text-[color:var(--danger)]" aria-hidden="true" />
                  위험재고 보유 판매처 TOP 10
                </span>
                <span className="mt-1 block truncate text-[13px] font-normal leading-[var(--line-height-body)] text-[color:var(--text-body)]">
                  위험 SKU 수 → 예상 폐기수량 순
                </span>
              </span>
              <Icon
                icon={ChevronDown}
                size={18}
                className="shrink-0 text-[color:var(--text-muted)] transition-transform group-data-[state=open]:rotate-180"
                aria-hidden="true"
              />
            </AccordionTrigger>
            <AccordionContent>
              <RiskSalesPointTable points={riskSalesPoints} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </Card>
  );
}
