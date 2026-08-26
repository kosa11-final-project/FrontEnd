import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StrategyActionTypeBadge } from './StrategyActionTypeBadge.jsx';

describe('StrategyActionTypeBadge', () => {
  it.each([
    ['RT_TRANSFER', 'RT 이동', 'bg-[#CFF4FC]'],
    ['PRICE_DISCOUNT', '할인', 'bg-[#FFF8E6]'],
    ['CHANNEL_EXPANSION', '채널 확장', 'bg-[#DAF7E9]'],
  ])('%s 유형을 구분되는 색상으로 표시한다', (type, label, backgroundClass) => {
    render(<StrategyActionTypeBadge type={type} compact />);

    expect(screen.getByText(label)).toHaveClass(backgroundClass);
  });
});
