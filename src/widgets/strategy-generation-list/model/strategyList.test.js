import { describe, expect, it } from 'vitest';
import { strategyGenerationFixtures } from './strategyFixtures.js';
import { filterStrategies, getStrategyStatusCounts, paginateStrategies } from './strategyList.js';

describe('AI 전략 생성 목록 규칙', () => {
  it('전략번호·전략명·상품명으로 검색한다', () => {
    expect(filterStrategies(strategyGenerationFixtures, { query: 'ST-2026-032' })).toHaveLength(1);
    expect(filterStrategies(strategyGenerationFixtures, { query: '수도권 재배치' })[0].id).toBe(32);
    expect(filterStrategies(strategyGenerationFixtures, { query: '닭가슴살 샐러드' })[0].id).toBe(22);
  });

  it('서울 기준 시작일과 종료일을 모두 포함한다', () => {
    const result = filterStrategies(strategyGenerationFixtures, { from: '2026-08-16', to: '2026-08-17' });
    expect(result.map(({ id }) => id)).toEqual([32, 31, 30]);
  });

  it('상태를 필터링하고 생성일시 내림차순으로 정렬한다', () => {
    const result = filterStrategies(strategyGenerationFixtures, { status: 'GENERATING' });
    expect(result.every(({ generationStatus }) => generationStatus === 'GENERATING')).toBe(true);
    expect(result.map(({ id }) => id)).toEqual([31, 28, 24]);
  });

  it('검색·기간 결과를 기준으로 상태 건수를 계산한다', () => {
    const counts = getStrategyStatusCounts(strategyGenerationFixtures, { from: '2026-08-15' });
    expect(counts).toEqual({ ALL: 4, GENERATED: 2, GENERATING: 1, GENERATION_FAILED: 1 });
  });

  it('페이지 범위를 보정하고 10개씩 나눈다', () => {
    expect(paginateStrategies(strategyGenerationFixtures, 1).items).toHaveLength(10);
    expect(paginateStrategies(strategyGenerationFixtures, 2).items).toHaveLength(2);
    expect(paginateStrategies(strategyGenerationFixtures, 99).page).toBe(2);
  });
});
