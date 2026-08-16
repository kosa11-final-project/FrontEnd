import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('DOM Component Test Harness', () => {
  it('renders a DOM element and uses jest-dom matchers', () => {
    render(<div data-testid="test-element">통합 재고 테스트</div>);
    const element = screen.getByTestId('test-element');
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('통합 재고 테스트');
  });
});
