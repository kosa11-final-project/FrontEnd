import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InventoryStatusBadge, resolveInventoryStatus } from './InventoryStatusBadge.jsx';

describe('InventoryStatusBadge', () => {
  it('does not expose a transient missing risk grade as unassessed', () => {
    expect(resolveInventoryStatus(null)).toBe('loading');
    expect(resolveInventoryStatus()).toBe('loading');

    render(<InventoryStatusBadge status={null} />);

    expect(screen.getByText('확인 중')).toBeInTheDocument();
    expect(screen.queryByText('미판정')).not.toBeInTheDocument();
  });

  it('uses the explicit unassessed status even when a stale grade is present', () => {
    render(<InventoryStatusBadge status="DANGER" assessmentStatus="UNASSESSED" />);

    expect(screen.getByText('미판정')).toBeInTheDocument();
    expect(screen.queryByText('위험')).not.toBeInTheDocument();
  });

  it('does not treat inherited object keys as supported statuses', () => {
    expect(resolveInventoryStatus('constructor')).toBe('loading');
    expect(resolveInventoryStatus('toString')).toBe('loading');
  });

  it('normalizes the legacy observation label to the canonical normal label', () => {
    render(<InventoryStatusBadge status="관찰" assessmentStatus="ASSESSED" />);

    expect(screen.getByText('보통')).toBeInTheDocument();
    expect(screen.queryByText('관찰')).not.toBeInTheDocument();
  });

  it('DB 위험등급을 서비스 한글 등급으로 표시한다', () => {
    const { rerender } = render(<InventoryStatusBadge status="GOOD" assessmentStatus="ASSESSED" />);
    expect(screen.getByText('양호')).toBeInTheDocument();

    rerender(<InventoryStatusBadge status="WARNING" assessmentStatus="ASSESSED" />);
    expect(screen.getByText('주의')).toBeInTheDocument();

    rerender(<InventoryStatusBadge status="CRITICAL" assessmentStatus="ASSESSED" />);
    expect(screen.getByText('위험')).toBeInTheDocument();
  });
});
