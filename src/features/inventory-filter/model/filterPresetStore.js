import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CHANNEL_NAMES, STORAGE_NAMES } from '@/entities/inventory/model/inventory.js';
import { getRiskGradeLabel } from '@/entities/risk/model/risk.js';

export const MAX_RECENT_FILTERS = 5;

/** 필터 객체가 기본(비어있는) 상태인지 확인 */
export function isFilterEmpty(filters) {
  if (!filters) return true;
  return (
    !filters.q &&
    (!filters.channelType || filters.channelType.length === 0) &&
    (!filters.salesPointCode || filters.salesPointCode.length === 0) &&
    (!filters.warehouseCode || filters.warehouseCode.length === 0) &&
    (!filters.categoryIds || filters.categoryIds.length === 0) &&
    !filters.categoryId &&
    (!filters.storageType || filters.storageType.length === 0) &&
    (!filters.riskGrade || filters.riskGrade.length === 0) &&
    !filters.shortageYn
  );
}

/** 필터 조건을 식별 가능한 정규화 문자열로 변환 (중복 비교용) */
export function getFilterFingerprint(filters) {
  if (!filters) return '';
  return JSON.stringify({
    q: filters.q?.trim() || '',
    filterOperator: filters.filterOperator || 'AND',
    channelType: [...(filters.channelType || [])].sort(),
    salesPointCode: [...(filters.salesPointCode || [])].sort(),
    warehouseCode: [...(filters.warehouseCode || [])].sort(),
    categoryIds: [...(filters.categoryIds || (filters.categoryId ? [filters.categoryId] : []))].sort(),
    storageType: [...(filters.storageType || [])].sort(),
    riskGrade: [...(filters.riskGrade || [])].sort(),
    shortageYn: filters.shortageYn || '',
  });
}

/** 필터 객체를 사람이 읽기 쉬운 요약 라벨로 변환 */
export function formatFilterSummary(filters) {
  if (!filters || isFilterEmpty(filters)) return '전체 조건';

  const parts = [];

  if (filters.q?.trim()) {
    parts.push(`"${filters.q.trim()}"`);
  }

  if (filters.channelType?.length) {
    const channelNames = filters.channelType.map((code) => CHANNEL_NAMES[code] || code);
    parts.push(channelNames.join(', '));
  }

  if (filters.storageType?.length) {
    const storageNames = filters.storageType.map((type) => STORAGE_NAMES[type] || type);
    parts.push(storageNames.join(', '));
  }

  if (filters.riskGrade?.length) {
    const riskLabels = filters.riskGrade.map((grade) => getRiskGradeLabel(grade));
    parts.push(riskLabels.join(', '));
  }

  if (filters.warehouseCode?.length) {
    parts.push(`센터 ${filters.warehouseCode.length}곳`);
  }

  if (filters.salesPointCode?.length) {
    parts.push(`판매처 ${filters.salesPointCode.length}곳`);
  }

  if (filters.shortageYn === 'Y') {
    parts.push('재고 부족 포함');
  }

  return parts.length ? parts.join(' · ') : '선택된 필터';
}

/** 저장 가능한 깨끗한 필터 파라미터만 추출 */
export function cleanFilterForPreset(filters) {
  if (!filters) return {};
  return {
    q: filters.q || '',
    filterOperator: filters.filterOperator || 'AND',
    channelType: Array.isArray(filters.channelType) ? filters.channelType : [],
    salesPointCode: Array.isArray(filters.salesPointCode) ? filters.salesPointCode : [],
    warehouseCode: Array.isArray(filters.warehouseCode) ? filters.warehouseCode : [],
    categoryId: filters.categoryId || '',
    categoryIds: Array.isArray(filters.categoryIds) ? filters.categoryIds : [],
    storageType: Array.isArray(filters.storageType) ? filters.storageType : [],
    riskGrade: Array.isArray(filters.riskGrade) ? filters.riskGrade : [],
    shortageYn: filters.shortageYn || '',
  };
}

export const RECENT_FILTER_MERGE_WINDOW_MS = 15000;

export const useFilterPresetStore = create(
  persist(
    (set, get) => ({
      recentFilters: [],
      savedPresets: [],

      /** 최근 검색/필터 추가 (세션 내에서는 단일 슬롯 갱신, 페이지 재방문 시 새 슬롯으로 적재, 최대 5개) */
      addRecentFilter: (filters, sessionId = null) => {
        if (!filters || isFilterEmpty(filters)) return;

        const cleaned = cleanFilterForPreset(filters);
        const fingerprint = getFilterFingerprint(cleaned);
        const summary = formatFilterSummary(cleaned);
        const currentRecent = get().recentFilters;
        const now = Date.now();

        // 1. 동일 세션(페이지 체류 중)으로 이미 등록된 항목이 있는지 확인
        const existingSessionIndex = sessionId ? currentRecent.findIndex((item) => item.sessionId === sessionId) : -1;

        if (existingSessionIndex !== -1) {
          // 동일 세션 내 연속 변경: 별도 행으로 쌓지 않고 현재 세션 항목을 최종 상태로 덮어쓰기(업데이트)
          const updatedItem = {
            ...currentRecent[existingSessionIndex],
            name: summary,
            fingerprint,
            filters: cleaned,
            timestamp: now,
          };

          const nextList = [...currentRecent];
          nextList.splice(existingSessionIndex, 1);
          set({
            recentFilters: [updatedItem, ...nextList].slice(0, MAX_RECENT_FILTERS),
          });
          return;
        }

        // 2. 새로운 세션(페이지 새로 방문 또는 초기화 후 새 탐색)
        const withoutDuplicate = currentRecent.filter((item) => item.fingerprint !== fingerprint);

        const newItem = {
          id: `recent-${now}-${Math.random().toString(36).slice(2, 7)}`,
          sessionId: sessionId || null,
          name: summary,
          fingerprint,
          filters: cleaned,
          timestamp: now,
        };

        set({
          recentFilters: [newItem, ...withoutDuplicate].slice(0, MAX_RECENT_FILTERS),
        });
      },

      /** 최근 필터 단건 삭제 */
      removeRecentFilter: (id) => {
        set({
          recentFilters: get().recentFilters.filter((item) => item.id !== id),
        });
      },

      /** 최근 필터 전체 지우기 */
      clearRecentFilters: () => {
        set({ recentFilters: [] });
      },

      /** 현재 필터를 프리셋으로 저장 */
      savePreset: (name, filters) => {
        if (!filters || isFilterEmpty(filters)) return null;

        const cleaned = cleanFilterForPreset(filters);
        const trimmedName = (name || '').trim() || formatFilterSummary(cleaned);

        const newPreset = {
          id: `preset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: trimmedName,
          summary: formatFilterSummary(cleaned),
          fingerprint: getFilterFingerprint(cleaned),
          filters: cleaned,
          createdAt: Date.now(),
        };

        set({
          savedPresets: [newPreset, ...get().savedPresets],
        });

        return newPreset;
      },

      /** 저장된 프리셋 삭제 */
      removeSavedPreset: (id) => {
        set({
          savedPresets: get().savedPresets.filter((preset) => preset.id !== id),
        });
      },
    }),
    {
      name: 'inventory-filter-presets-v1',
    },
  ),
);
