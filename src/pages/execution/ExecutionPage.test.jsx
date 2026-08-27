import { useMemo, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { filterStrategies, strategyExecutionFixtures } from '@/entities/strategy';
import { defaultStrategyExecutionFilters, STRATEGY_EXECUTION_PAGE_SIZE } from '@/features/strategy-execution-filter';
import { StrategyExecutionDetailContent } from './ExecutionDetailPage.jsx';
import { StrategyExecutionListContent } from './ExecutionListPage.jsx';

const renderRoute = (ui, path = '/execution') => render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);

function StrategyExecutionListHarness({ strategies = strategyExecutionFixtures, onSync }) {
  const [filters, setFilters] = useState(defaultStrategyExecutionFilters);
  const filtered = useMemo(() => filterStrategies(strategies, filters), [filters, strategies]);
  return (
    <StrategyExecutionListContent
      strategies={filtered}
      filters={filters}
      pagination={{
        page: 1,
        size: STRATEGY_EXECUTION_PAGE_SIZE,
        totalElements: filtered.length,
        totalPages: 1,
      }}
      onFiltersChange={setFilters}
      onPageChange={() => {}}
      onSync={onSync}
    />
  );
}

describe('strategy execution pages', () => {
  it('renders strategy execution summary metrics', () => {
    renderRoute(<StrategyExecutionListHarness />);

    expect(screen.getByRole('region', { name: '전략 실행 요약' })).toBeInTheDocument();
    expect(screen.getByText('실행 전략 수')).toBeInTheDocument();
    expect(screen.getByText('진행 중 전략 수')).toBeInTheDocument();
    expect(screen.getByText('확인 필요 전략 수')).toBeInTheDocument();
    expect(screen.getByText('전체 전략 수')).toBeInTheDocument();
  });

  it('filters strategies by action type and search', async () => {
    const user = userEvent.setup();
    renderRoute(<StrategyExecutionListHarness />);
    expect(screen.getByText('비비고 왕교자 1.05kg')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '비비고 왕교자 1.05kg 상품 이미지' })).toBeInTheDocument();
    expect(screen.queryByLabelText('계열사')).not.toBeInTheDocument();
    await user.click(screen.getByRole('combobox', { name: '전략 유형' }));
    await user.click(screen.getByRole('option', { name: 'RT 이동' }));
    expect(screen.getByText('프리미엄 오피스 체어 에어')).toBeInTheDocument();
    expect(screen.queryByText('비비고 왕교자 1.05kg')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('전략 코드, 상품명 또는 SKU 코드 검색'), { target: { value: '없는 전략' } });
    fireEvent.click(screen.getByRole('button', { name: '검색' }));
    expect(screen.getByText('조건에 맞는 실행 전략이 없습니다.')).toBeInTheDocument();
  });
  it('offers manual performance synchronization', () => {
    const onSync = vi.fn();
    renderRoute(<StrategyExecutionListHarness onSync={onSync} />);

    fireEvent.click(screen.getByRole('button', { name: '전략 성과 동기화' }));

    expect(onSync).toHaveBeenCalledOnce();
    expect(screen.getByRole('region', { name: '전략 성과 동기화' })).toHaveTextContent(
      '판매량, 매출, 기여이익과 잔여재고',
    );
  });
  it('renders multi-action dependency, missing data and required detail sections', () => {
    renderRoute(<StrategyExecutionDetailContent strategy={strategyExecutionFixtures[1]} />, '/execution/102');
    expect(screen.getByText('다중 전략 실행 흐름')).toBeInTheDocument();
    const strategyCardList = screen.getByRole('list', { name: '실행 전략 카드 목록' });
    expect(within(strategyCardList).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText(/선행 RT 이동 실패/)).toBeInTheDocument();
    expect(screen.getAllByText('미수집').length).toBeGreaterThan(0);
    expect(screen.getByText('재고 이동 경로')).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: '서부센터 → 동부센터, 90개 이동' })).toBeInTheDocument();
    expect(screen.getByText('위치별 재고 변화')).toBeInTheDocument();
    expect(screen.getAllByText('전략 시작').length).toBeGreaterThan(0);
    expect(screen.getAllByText('현재 재고').length).toBeGreaterThan(0);
    expect(screen.getByRole('img', { name: '위치별 재고 변화 비교 가로 막대 차트' })).toBeInTheDocument();
    expect(screen.getByText('채널별 판매 성과 리포트')).toBeInTheDocument();
    expect(screen.getByText('채널 판매 성과가 없습니다.')).toBeInTheDocument();
    expect(screen.queryByText('동기화 이력')).not.toBeInTheDocument();
    expect(screen.queryByText('경고 및 후속 추천')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: '프리미엄 오피스 체어 에어 상품 이미지 없음' })).toBeInTheDocument();
    expect(screen.queryByText('이동 수량')).not.toBeInTheDocument();
    expect(screen.queryByText('폐기 수량')).not.toBeInTheDocument();
  });
  it('renders an interactive daily sales area chart for an executing strategy', () => {
    renderRoute(<StrategyExecutionDetailContent strategy={strategyExecutionFixtures[0]} />, '/execution/101');
    const chartSection = screen.getByText('판매처별 SKU 일일 판매량').closest('section');
    expect(chartSection).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '전체 판매처 SKU 일별 판매량 비교 영역 차트' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '채널별 매출 비중 트리맵' })).toBeInTheDocument();
    expect(within(chartSection).getByText(/이동 대상 판매처/)).toBeInTheDocument();
    expect(within(chartSection).getByText(/기존 판매처/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '그리팅몰' }));
    expect(screen.getByRole('img', { name: '그리팅몰 SKU 일별 판매량 비교 영역 차트' })).toBeInTheDocument();
    expect(within(chartSection).getByText('173개')).toBeInTheDocument();
  });
  it('renders nullable backend fields as missing instead of zero or completed', () => {
    const strategy = {
      ...strategyExecutionFixtures[0],
      status: null,
      progress: null,
      goal: null,
      resultSummary: null,
      actions: [],
      inventoryResults: [],
      inventoryTransfers: [],
      channelResults: [],
      salesDaily: [],
      salesPointComparison: [],
      performance: null,
      lastSyncedAt: null,
    };
    renderRoute(<StrategyExecutionDetailContent strategy={strategy} />, '/execution/101');

    expect(screen.getByText('상태 미수집')).toBeInTheDocument();
    expect(screen.getAllByText('미수집').length).toBeGreaterThan(1);
    expect(screen.getByText('실행 액션이 없습니다.')).toBeInTheDocument();
    expect(screen.getByText('전략 전체 성과가 아직 수집되지 않았습니다.')).toBeInTheDocument();
    expect(screen.getByText('재고 이동 경로가 없습니다.')).toBeInTheDocument();
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  it('rounds the overall sales result to whole numbers', () => {
    const strategy = {
      ...strategyExecutionFixtures[0],
      resultSummary: '실제 판매 200 / 목표 180.4 (달성률 111.111111%)',
    };
    renderRoute(<StrategyExecutionDetailContent strategy={strategy} />, '/execution/101');

    expect(screen.getByText('실제 판매 200 / 목표 180 (달성률 111%)')).toBeInTheDocument();
    expect(screen.queryByText(/180\.4/)).not.toBeInTheDocument();
    expect(screen.queryByText(/111\.111111%/)).not.toBeInTheDocument();
  });
});
