import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import AppSidebar from './AppSidebar.jsx';

describe('AppSidebar', () => {
  it('전략 실행 상세 경로에서도 상위 실행 관제 메뉴를 현재 위치로 표시한다', () => {
    render(
      <MemoryRouter initialEntries={['/execution/101']}>
        <AppSidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'AI 전략 실행 관제' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '대시보드' })).not.toHaveAttribute('aria-current');
  });

  it('AI 전략 상세 경로에서도 상위 전략 메뉴를 현재 위치로 표시한다', () => {
    render(
      <MemoryRouter initialEntries={['/ai-strategy/101']}>
        <AppSidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'AI 전략 및 시뮬레이션' })).toHaveAttribute('aria-current', 'page');
  });
});
