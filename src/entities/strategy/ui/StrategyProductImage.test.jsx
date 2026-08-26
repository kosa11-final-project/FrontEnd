import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StrategyProductImage } from './StrategyProductImage.jsx';

describe('StrategyProductImage', () => {
  it('이미지 로드 실패 후 주소가 바뀌면 새 이미지를 다시 표시한다', () => {
    const { rerender } = render(<StrategyProductImage src="/broken.png" alt="테스트 상품" />);

    fireEvent.error(screen.getByRole('img', { name: '테스트 상품' }));
    expect(screen.getByRole('img', { name: '테스트 상품 없음' })).toBeInTheDocument();

    rerender(<StrategyProductImage src="/next.png" alt="테스트 상품" />);

    expect(screen.getByRole('img', { name: '테스트 상품' })).toHaveAttribute('src', '/next.png');
  });
});
