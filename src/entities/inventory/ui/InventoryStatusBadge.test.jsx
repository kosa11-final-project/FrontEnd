import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InventoryStatusBadge, resolveInventoryStatus } from './InventoryStatusBadge.jsx';

describe('InventoryStatusBadge', () => {
  it('does not turn a missing risk grade into a normal assessment', () => {
    expect(resolveInventoryStatus(null)).toBe('unassessed');
    expect(resolveInventoryStatus()).toBe('unassessed');

    render(<InventoryStatusBadge status={null} />);

    expect(screen.getByText('판정 불가')).toBeInTheDocument();
  });
});
