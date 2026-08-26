import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/ui/Accordion.jsx';

const meta = {
  title: 'Shared UI/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '재고 운영 정보처럼 여러 섹션을 접고 펼치는 공통 아코디언입니다. 단일·복수 섹션 상태를 함께 확인합니다.',
      },
    },
  },
};

export default meta;

function AccordionPreview({ multiple = false, defaultValue = [] }) {
  return (
    <div className="mx-auto w-full max-w-2xl rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)]">
      <Accordion multiple={multiple} defaultValue={defaultValue}>
        <AccordionItem value="urgent">
          <AccordionTrigger>
            <span>
              <span className="block font-semibold text-[color:var(--text-heading)]">긴급 처리 SKU TOP 5</span>
              <span className="mt-1 block text-xs font-normal text-[color:var(--text-muted)]">
                위험등급·예상 폐기수량 기준 우선 조치
              </span>
            </span>
            <span aria-hidden="true" className="text-[color:var(--text-muted)]">
              ⌄
            </span>
          </AccordionTrigger>
          <AccordionContent className="p-4 text-sm text-[color:var(--text-body)]">
            <ul className="grid gap-2">
              <li className="rounded-md bg-[var(--surface-subtle)] p-3">두부버섯 도시락 · 350g</li>
              <li className="rounded-md bg-[var(--surface-subtle)] p-3">닭가슴살 샐러드 · 220g</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="risk">
          <AccordionTrigger>
            <span>
              <span className="block font-semibold text-[color:var(--text-heading)]">위험재고 보유 판매처 TOP 10</span>
              <span className="mt-1 block text-xs font-normal text-[color:var(--text-muted)]">
                위험 SKU 수 → 예상 폐기수량 순
              </span>
            </span>
            <span aria-hidden="true" className="text-[color:var(--text-muted)]">
              ⌄
            </span>
          </AccordionTrigger>
          <AccordionContent className="p-4 text-sm text-[color:var(--text-body)]">
            <div className="rounded-md bg-[var(--surface-subtle)] p-3">압구정본점 · 위험 SKU 7개 · 예상 폐기 24개</div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export const SingleSection = {
  render: () => <AccordionPreview defaultValue={['urgent']} />,
};

export const MultipleSections = {
  render: () => <AccordionPreview multiple defaultValue={['urgent', 'risk']} />,
};
