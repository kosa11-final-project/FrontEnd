import { beforeAll, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TooltipProvider } from '@/shared/ui';
import { InventoryRiskReasonTooltip, parseInventoryRiskReason } from './InventoryRiskReasonTooltip.jsx';

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe('InventoryRiskReasonTooltip', () => {
  it('separates the persisted server decision from its calculation evidence', () => {
    expect(
      parseInventoryRiskReason(
        '[ASSESSED/v1.1.0/SHORTAGE_D30] D+30 예상 수요가 가용재고를 초과합니다. | 산식: 가용재고=100, D+30부족량=max(0, 140-100)=40',
      ),
    ).toEqual({
      ruleVersion: 'v1.1.0',
      ruleCode: 'SHORTAGE_D30',
      primaryReason: 'D+30 예상 수요가 가용재고를 초과합니다.',
      calculationEvidence: '가용재고=100, D+30부족량=max(0, 140-100)=40',
    });
  });

  it('shows the DB-persisted reason and formula from an accessible trigger', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <InventoryRiskReasonTooltip reason="[ASSESSED/v1.1.0/SHORTAGE_D30] D+30 예상 수요가 가용재고를 초과합니다. | 산식: 가용재고=100, D+30부족량=max(0, 140-100)=40" />
      </TooltipProvider>,
    );

    const trigger = screen.getByRole('button', { name: '재고 위험 판정 이유 보기' });
    await user.hover(trigger);

    expect(await screen.findByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('D+30 예상 수요가 가용재고를 초과합니다.')).toBeInTheDocument();
    expect(screen.getByText('가용재고=100, D+30부족량=max(0, 140-100)=40')).toBeInTheDocument();
    expect(screen.getByText('규칙 v1.1.0 · SHORTAGE_D30')).toBeInTheDocument();
  });

  it('keeps a legacy reason readable without inventing a formula', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <InventoryRiskReasonTooltip reason="안전재고 목표치보다 12개 부족합니다." />
      </TooltipProvider>,
    );

    await user.tab();

    expect(await screen.findByRole('tooltip')).toHaveTextContent('안전재고 목표치보다 12개 부족합니다.');
    expect(screen.queryByText('계산 근거')).not.toBeInTheDocument();
  });

  it('opens from a tap-compatible click', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <InventoryRiskReasonTooltip reason="동기화 저장 사유" />
      </TooltipProvider>,
    );

    const trigger = screen.getByRole('button', { name: '재고 위험 판정 이유 보기' });
    await user.click(trigger);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('동기화 저장 사유');
  });

  it('does not render an empty explanation control', () => {
    const { container } = render(
      <TooltipProvider>
        <InventoryRiskReasonTooltip reason="   " />
      </TooltipProvider>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
