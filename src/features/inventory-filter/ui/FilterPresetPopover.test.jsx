import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFilterPresetStore } from '../model/filterPresetStore.js';
import { FilterPresetPopover } from './FilterPresetPopover.jsx';

describe('FilterPresetPopover', () => {
  beforeEach(() => {
    useFilterPresetStore.setState({
      recentFilters: [],
      savedPresets: [],
    });
  });

  it('renders trigger button with icon and label', () => {
    render(<FilterPresetPopover onApplyPreset={vi.fn()} />);
    expect(screen.getByRole('button', { name: /저장된 필터 및 최근 검색 기록 보기/ })).toBeInTheDocument();
    expect(screen.getByText('최근/저장 필터')).toBeInTheDocument();
  });

  it('shows empty state when no saved presets exist', () => {
    render(<FilterPresetPopover onApplyPreset={vi.fn()} />);
    const trigger = screen.getByRole('button', { name: /저장된 필터 및 최근 검색 기록 보기/ });
    fireEvent.click(trigger);

    expect(screen.getByText('저장된 필터가 없습니다')).toBeInTheDocument();
  });

  it('renders saved preset list and applies filter on item click', () => {
    const handleApply = vi.fn();
    useFilterPresetStore.getState().savePreset('내 그리팅 프리셋', {
      channelType: ['GREETING'],
    });

    render(<FilterPresetPopover onApplyPreset={handleApply} />);
    const trigger = screen.getByRole('button', { name: /저장된 필터 및 최근 검색 기록 보기/ });
    fireEvent.click(trigger);

    expect(screen.getByText('내 그리팅 프리셋')).toBeInTheDocument();

    fireEvent.click(screen.getByText('내 그리팅 프리셋'));
    expect(handleApply).toHaveBeenCalledWith(
      expect.objectContaining({
        channelType: ['GREETING'],
      }),
    );
  });

  it('switches to recent filters tab and displays recent search history', () => {
    const handleApply = vi.fn();
    useFilterPresetStore.getState().addRecentFilter({ q: '비비고 만두' });

    render(<FilterPresetPopover onApplyPreset={handleApply} />);
    const trigger = screen.getByRole('button', { name: /저장된 필터 및 최근 검색 기록 보기/ });
    fireEvent.click(trigger);

    // 최근 검색 탭 클릭
    const recentTab = screen.getByRole('tab', { name: /최근 검색/ });
    fireEvent.click(recentTab);

    expect(screen.getByText('"비비고 만두"')).toBeInTheDocument();

    fireEvent.click(screen.getByText('"비비고 만두"'));
    expect(handleApply).toHaveBeenCalledWith(
      expect.objectContaining({
        q: '비비고 만두',
      }),
    );
  });
});
