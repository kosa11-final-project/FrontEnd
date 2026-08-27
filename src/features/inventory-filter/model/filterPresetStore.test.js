import { beforeEach, describe, expect, it } from 'vitest';
import { cleanFilterForPreset, formatFilterSummary, isFilterEmpty, useFilterPresetStore } from './filterPresetStore.js';

describe('filterPresetStore', () => {
  beforeEach(() => {
    useFilterPresetStore.setState({
      recentFilters: [],
      savedPresets: [],
    });
  });

  describe('helpers', () => {
    it('correctly identifies empty and non-empty filters', () => {
      expect(isFilterEmpty({})).toBe(true);
      expect(isFilterEmpty({ q: '', channelType: [] })).toBe(true);
      expect(isFilterEmpty({ q: '만두' })).toBe(false);
      expect(isFilterEmpty({ channelType: ['GREETING'] })).toBe(false);
      expect(isFilterEmpty({ shortageYn: 'Y' })).toBe(false);
    });

    it('formats a human-readable summary of the filters', () => {
      expect(formatFilterSummary({})).toBe('전체 조건');
      expect(formatFilterSummary({ q: '비비고' })).toBe('"비비고"');
      expect(formatFilterSummary({ q: '만두', channelType: ['GREETING'], storageType: ['FROZEN'] })).toBe(
        '"만두" · 그리팅 · 냉동',
      );
    });

    it('cleans filters for serialization without extraneous keys', () => {
      const cleaned = cleanFilterForPreset({
        q: '만두',
        channelType: ['GREETING'],
        someRandomKey: 123,
      });

      expect(cleaned).toEqual(
        expect.objectContaining({
          q: '만두',
          channelType: ['GREETING'],
        }),
      );
      expect(cleaned).not.toHaveProperty('someRandomKey');
    });
  });

  describe('recentFilters', () => {
    it('does not add empty filters to recentFilters', () => {
      const store = useFilterPresetStore.getState();
      store.addRecentFilter({});
      store.addRecentFilter({ q: '' });

      expect(useFilterPresetStore.getState().recentFilters).toHaveLength(0);
    });

    it('limits recentFilters to at most 5 items', () => {
      const store = useFilterPresetStore.getState();

      for (let i = 1; i <= 7; i++) {
        store.addRecentFilter({ q: `검색어 ${i}` });
      }

      const recent = useFilterPresetStore.getState().recentFilters;
      expect(recent).toHaveLength(5);
      expect(recent[0].filters.q).toBe('검색어 7');
      expect(recent[4].filters.q).toBe('검색어 3');
    });

    it('updates the single session slot while on the page and creates a new entry on a new session', () => {
      const store = useFilterPresetStore.getState();
      const session1 = 'session-1';

      // 세션 1에서 필터를 3번 변경 (모두의맛집 -> 직영점 추가 -> 냉동 추가)
      store.addRecentFilter({ channelType: ['ECOMMERCE'] }, session1);
      store.addRecentFilter({ channelType: ['ECOMMERCE', 'HYUNDAI_DEPT'] }, session1);
      store.addRecentFilter({ channelType: ['ECOMMERCE', 'HYUNDAI_DEPT'], storageType: ['FROZEN'] }, session1);

      // 같은 세션 내에서는 오직 1건만 최종 상태로 업데이트됨
      let recent = useFilterPresetStore.getState().recentFilters;
      expect(recent).toHaveLength(1);
      expect(recent[0].sessionId).toBe(session1);
      expect(recent[0].filters.storageType).toEqual(['FROZEN']);

      // 페이지를 나갔다가 다시 들어와서 새로운 세션 2 시작
      const session2 = 'session-2';
      store.addRecentFilter({ q: '만두' }, session2);

      recent = useFilterPresetStore.getState().recentFilters;
      expect(recent).toHaveLength(2);
      expect(recent[0].sessionId).toBe(session2);
      expect(recent[0].filters.q).toBe('만두');
      expect(recent[1].sessionId).toBe(session1);
    });

    it('creates a new entry after the merge window has expired', () => {
      const store = useFilterPresetStore.getState();
      store.addRecentFilter({ q: '만두' });

      // 이전 항목의 timestamp를 20초 전으로 조작
      useFilterPresetStore.setState({
        recentFilters: [
          {
            ...useFilterPresetStore.getState().recentFilters[0],
            timestamp: Date.now() - 20000,
          },
        ],
      });

      store.addRecentFilter({ q: '김치' });
      const recent = useFilterPresetStore.getState().recentFilters;
      expect(recent).toHaveLength(2);
      expect(recent[0].filters.q).toBe('김치');
      expect(recent[1].filters.q).toBe('만두');
    });

    it('removes a single recent filter or clears all', () => {
      const store = useFilterPresetStore.getState();
      store.addRecentFilter({ q: '만두' });
      store.addRecentFilter({ q: '김치' });

      let recent = useFilterPresetStore.getState().recentFilters;
      const targetId = recent[0].id;
      store.removeRecentFilter(targetId);

      recent = useFilterPresetStore.getState().recentFilters;
      expect(recent).toHaveLength(1);
      expect(recent[0].filters.q).toBe('만두');

      store.clearRecentFilters();
      expect(useFilterPresetStore.getState().recentFilters).toHaveLength(0);
    });
  });

  describe('savedPresets', () => {
    it('saves a new preset with custom or default name', () => {
      const store = useFilterPresetStore.getState();
      const preset = store.savePreset('내 그리팅 모니터링', {
        channelType: ['GREETING'],
        storageType: ['FROZEN'],
      });

      expect(preset).not.toBeNull();
      expect(preset.name).toBe('내 그리팅 모니터링');
      expect(useFilterPresetStore.getState().savedPresets).toHaveLength(1);
      expect(useFilterPresetStore.getState().savedPresets[0].filters.channelType).toEqual(['GREETING']);
    });

    it('uses formatted summary when name is empty', () => {
      const store = useFilterPresetStore.getState();
      const preset = store.savePreset('', {
        q: '비비고',
        channelType: ['GREETING'],
      });

      expect(preset.name).toBe('"비비고" · 그리팅');
    });

    it('removes a saved preset by id', () => {
      const store = useFilterPresetStore.getState();
      const preset1 = store.savePreset('프리셋 1', { q: '1' });
      store.savePreset('프리셋 2', { q: '2' });

      expect(useFilterPresetStore.getState().savedPresets).toHaveLength(2);
      store.removeSavedPreset(preset1.id);

      const saved = useFilterPresetStore.getState().savedPresets;
      expect(saved).toHaveLength(1);
      expect(saved[0].name).toBe('프리셋 2');
    });
  });
});
