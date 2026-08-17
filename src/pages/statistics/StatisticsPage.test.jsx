import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StatisticsPageContent } from './StatisticsPage.jsx';
import { inventoryStatisticsFixture } from './model/statisticsFixtures.js';

describe('StatisticsPageContent', () => {
  it('기간과 위치 필터를 재고 통계 API 조회 조건으로 전달한다', async () => {
    const user = userEvent.setup();
    const onQueryParamsChange = vi.fn();

    render(
      <MemoryRouter>
        <StatisticsPageContent statistics={inventoryStatisticsFixture} onQueryParamsChange={onQueryParamsChange} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: '7일' }));
    expect(onQueryParamsChange).toHaveBeenLastCalledWith({
      fromDate: '2026-08-10',
      toDate: '2026-08-16',
      scopeType: 'NATIONAL',
      scopeCode: 'ALL',
    });

    await user.selectOptions(screen.getByRole('combobox', { name: '통계 범위' }), 'WAREHOUSE');
    expect(onQueryParamsChange).toHaveBeenLastCalledWith({
      fromDate: '2026-08-10',
      toDate: '2026-08-16',
      scopeType: 'WAREHOUSE',
      scopeCode: 'ALL',
    });

    await user.selectOptions(screen.getByRole('combobox', { name: '세부 위치' }), 'WH_SEONGNAM');
    expect(onQueryParamsChange).toHaveBeenLastCalledWith({
      fromDate: '2026-08-10',
      toDate: '2026-08-16',
      scopeType: 'WAREHOUSE',
      scopeCode: 'WH_SEONGNAM',
    });
  });
});
