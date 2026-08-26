import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StatisticsPageContent } from './StatisticsPage.jsx';
import { inventoryStatisticsFixture } from './model/statisticsFixtures.js';

describe('StatisticsPageContent', () => {
  it('합의한 AI 전략 핵심 지표와 위험재고 기간 내 변화를 각각 보여준다', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <StatisticsPageContent statistics={inventoryStatisticsFixture} />
      </MemoryRouter>,
    );

    expect(screen.getAllByText('완료 전략')).not.toHaveLength(0);
    expect(screen.getAllByText('평균 목표 달성률')).not.toHaveLength(0);
    expect(screen.getAllByText('위험재고 감소')).not.toHaveLength(0);
    expect(screen.getAllByText('폐기위험 감소')).not.toHaveLength(0);
    expect(screen.getAllByText('추정 손실 절감액')).not.toHaveLength(0);
    expect(screen.getByText(/목표 달성 전략 \d+건\/75건 · \d+\.\d%/)).toBeInTheDocument();
    expect(screen.queryByText(/이전 기간 대비/)).not.toBeInTheDocument();

    expect(screen.getAllByRole('button', { name: /계산 기준/ })).toHaveLength(5);

    expect(screen.getByRole('heading', { name: '액션 조합별 성과' })).toBeInTheDocument();
    expect(screen.getByText('API 연결 전 화면 검토용')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: '위험재고 추이' }));

    expect(screen.getByText('기간 시작 위험재고')).toBeInTheDocument();
    expect(screen.getByText('기간 종료 위험재고')).toBeInTheDocument();
    expect(screen.getByText('위험재고 순변화')).toBeInTheDocument();
    expect(screen.getAllByText('위험재고 비율')).not.toHaveLength(0);
    expect(screen.getAllByText('위험 SKU 수')).not.toHaveLength(0);
    expect(screen.getAllByText('위험재고 수량')).not.toHaveLength(0);
    expect(screen.queryByText('직전 동일 기간 대비')).not.toBeInTheDocument();
    expect(
      screen.getByText(/기간 종료 위험재고는 941,095개로, 기간 시작보다 2,900개 순감했습니다/),
    ).toBeInTheDocument();
    expect(screen.getByText(/신규 입고·판매·이동·폐기가 모두 반영된 전체 재고 상태/)).toBeInTheDocument();
    expect(screen.getByText(/24\.9% → 24\.8%/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /계산 기준/ })).toHaveLength(5);
    expect(screen.getByRole('heading', { name: '전체 위험재고 추이' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '위험재고 구성 변화' })).toBeInTheDocument();
  });

  it('위험재고 스냅샷이 부족하면 0 대신 데이터 부족 상태를 보여준다', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <StatisticsPageContent
          statistics={{
            ...inventoryStatisticsFixture,
            trendScopeType: 'NATIONAL',
            trendScopeCode: 'ALL',
            dailyTrend: [],
          }}
        />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('tab', { name: '위험재고 추이' }));

    expect(screen.getByText('위험재고 변화를 비교할 집계가 부족합니다.')).toBeInTheDocument();
    expect(screen.queryByText('기간 시작 위험재고')).not.toBeInTheDocument();
  });

  it('기간과 위치 필터 변경 조건을 외부에 전달한다', async () => {
    const user = userEvent.setup();
    const onQueryParamsChange = vi.fn();

    render(
      <MemoryRouter>
        <StatisticsPageContent statistics={inventoryStatisticsFixture} onQueryParamsChange={onQueryParamsChange} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: '1년' }));
    expect(onQueryParamsChange).toHaveBeenLastCalledWith({
      fromDate: '2025-08-17',
      toDate: '2026-08-16',
      scopeType: 'NATIONAL',
      scopeCode: 'ALL',
    });

    await user.click(screen.getByRole('button', { name: '7일' }));
    expect(onQueryParamsChange).toHaveBeenLastCalledWith({
      fromDate: '2026-08-10',
      toDate: '2026-08-16',
      scopeType: 'NATIONAL',
      scopeCode: 'ALL',
    });

    screen.getByRole('combobox', { name: '통계 범위' }).focus();
    await user.keyboard('{Enter}{ArrowDown}{Enter}');
    expect(onQueryParamsChange).toHaveBeenLastCalledWith({
      fromDate: '2026-08-10',
      toDate: '2026-08-16',
      scopeType: 'WAREHOUSE',
      scopeCode: 'ALL',
    });

    screen.getByRole('combobox', { name: '세부 위치' }).focus();
    await user.keyboard('{Enter}{ArrowDown}{Enter}');
    expect(onQueryParamsChange).toHaveBeenLastCalledWith({
      fromDate: '2026-08-10',
      toDate: '2026-08-16',
      scopeType: 'WAREHOUSE',
      scopeCode: 'WH_SEONGNAM',
    });
  });

  it('직접 선택 시 날짜 범위 캘린더를 연다', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <StatisticsPageContent statistics={inventoryStatisticsFixture} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: '직접 선택' }));
    await user.click(screen.getByRole('button', { name: '통계 조회 기간 선택' }));

    expect(screen.getByText('시작일과 종료일을 선택해 주세요. 최대 1년까지 조회할 수 있습니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '적용' })).toBeEnabled();
  });

  it('AI 전략 지표마다 의미에 맞는 서로 다른 차트를 보여준다', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <StatisticsPageContent statistics={inventoryStatisticsFixture} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('img', { name: '위험재고 감소 일별 막대 차트' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '목표 달성률' }));
    expect(screen.getByRole('img', { name: '목표 달성률 목표선 비교 차트' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '폐기위험 감소' }));
    expect(screen.getByRole('img', { name: '폐기위험 감소 영역 차트' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '추정 손실 절감' }));
    expect(screen.getByRole('img', { name: '일별 및 누적 추정 손실 절감 복합 차트' })).toBeInTheDocument();
  });
});
