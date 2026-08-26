import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AppSidebar from './AppSidebar.jsx';

describe('AppSidebar', () => {
  it('shows the StockFit brand without the platform descriptor', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppSidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole('img', { name: 'StockFit 로고' })).toHaveAttribute(
      'src',
      '/assets/brand/stockfit-sidebar-logo.png',
    );
    expect(screen.getByText('StockFit')).toBeInTheDocument();
    expect(screen.queryByText('현대그린푸드 통합 재고 관리 플랫폼')).not.toBeInTheDocument();
  });

  it('keeps the toggle inside the sidebar and reports the close action while open', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppSidebar isOpen onToggle={onToggle} />
      </MemoryRouter>,
    );

    const sidebar = screen.getByRole('complementary', { name: '주요 메뉴' });
    const toggle = screen.getByRole('button', { name: '사이드바 닫기' });

    expect(sidebar).toContainElement(toggle);
    expect(toggle).toHaveAttribute('aria-controls', 'app-sidebar');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(toggle);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('keeps the open action visible in the compact rail when closed', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppSidebar isOpen={false} onToggle={vi.fn()} />
      </MemoryRouter>,
    );

    const sidebar = screen.getByRole('complementary', { name: '주요 메뉴' });
    const toggle = screen.getByRole('button', { name: '사이드바 열기' });
    const content = sidebar.querySelector('.sidebar-content');

    expect(sidebar).toContainElement(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(content).toHaveAttribute('aria-hidden', 'true');
  });

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
