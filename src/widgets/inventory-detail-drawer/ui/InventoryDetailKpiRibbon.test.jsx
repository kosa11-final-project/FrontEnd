import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TooltipProvider } from '@/shared/ui';
import { InventoryDetailKpiRibbon } from './InventoryDetailKpiRibbon.jsx';

describe('InventoryDetailKpiRibbon', () => {
  it('exposes the persisted risk reason from the compact KPI ribbon', () => {
    render(
      <TooltipProvider>
        <InventoryDetailKpiRibbon
          item={{
            currentQuantity: 100,
            availableQuantity: 80,
            reservedQuantity: 20,
            safetyQuantity: 30,
            riskGrade: 'DANGER',
            assessmentStatus: 'ASSESSED',
            riskReason: '[ASSESSED/v1.1.0/PREDICTED_SHORTAGE] 동기화 저장 사유',
            nearestExpiryDays: 60,
            lotCount: 1,
          }}
        />
      </TooltipProvider>,
    );

    expect(screen.getByText('위험 판정')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '재고 위험 판정 이유 보기' })).toBeInTheDocument();
  });
});
