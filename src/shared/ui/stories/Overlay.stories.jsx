import { useState } from 'react';
import { Button } from '@/shared/ui/Button.jsx';
import { Drawer } from '@/shared/ui/Drawer.jsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/Tooltip.jsx';

const meta = {
  title: 'Shared UI/Overlay',
  tags: ['autodocs'],
};

function DetailDrawerStory() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>재고 상세 열기</Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="두부버섯 도시락 · 350g"
        description="GF-LUNCH-TOFU-350 · LOT 2026-08-03"
      >
        <div className="grid gap-4 text-[length:var(--font-size-body-sm)]">
          <p className="text-[color:var(--text-body)]">센터와 판매처별 현재고 및 가용수량을 확인합니다.</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-[var(--border)] p-3">
              <strong>현재고</strong>
              <br />
              284개
            </div>
            <div className="border border-[var(--border)] p-3">
              <strong>가용수량</strong>
              <br />
              250개
            </div>
          </div>
        </div>
      </Drawer>
    </>
  );
}

export default meta;

export const DetailDrawer = {
  render: DetailDrawerStory,
  parameters: { layout: 'fullscreen' },
};

export const RiskTooltip = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <span className="cursor-help border-b border-dashed border-[var(--warning)] text-[color:var(--warning)]">
            위험등급 기준
          </span>
        </TooltipTrigger>
        <TooltipContent>가용수량과 소비기한 잔여일을 기준으로 판단합니다.</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};
