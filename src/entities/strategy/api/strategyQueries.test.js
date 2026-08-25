import { describe, expect, it } from 'vitest';
import {
  aiStrategyDetailQueryOptions,
  aiStrategyKeys,
  aiStrategyListQueryOptions,
  aiStrategyReviewerQueryOptions,
} from './strategyQueries.js';

describe('AI strategy list query options', () => {
  it('includes the complete normalized search condition in the query key', () => {
    const params = {
      page: 1,
      size: 10,
      status: 'GENERATING',
      query: '만두',
      from: '2026-08-01',
      to: '2026-08-24',
      sort: 'createdAt,desc',
    };

    expect(aiStrategyKeys.list(params)).toEqual(['ai-strategies', 'list', params]);
    expect(aiStrategyListQueryOptions(params).queryKey).toEqual(['ai-strategies', 'list', params]);
  });

  it('omits empty filters from the canonical query key', () => {
    expect(aiStrategyKeys.list({ page: 0, size: 10, status: 'ALL', query: '', from: '', to: '' })).toEqual([
      'ai-strategies',
      'list',
      { page: 0, size: 10 },
    ]);
  });

  it('polls only while at least one visible case is generating', () => {
    const options = aiStrategyListQueryOptions({ page: 0, size: 10 });

    expect(options.refetchInterval({ state: { data: { statusCounts: { generating: 1 } } } })).toBe(4_000);
    expect(options.refetchInterval({ state: { data: { statusCounts: { generating: 0 } } } })).toBe(false);
    expect(options.refetchInterval({ state: { data: undefined } })).toBe(false);
    expect(options.placeholderData).toBeTypeOf('function');
    expect(options.retry(0, { status: 500 })).toBe(true);
    expect(options.retry(1, { status: 500 })).toBe(false);
    expect(options.retry(0, { status: 400 })).toBe(false);
  });

  it('uses a stable detail key and does not retry missing or expired results', () => {
    const options = aiStrategyDetailQueryOptions(123);

    expect(options.queryKey).toEqual(['ai-strategies', 'detail', '123']);
    expect(options.retry(0, { status: 404 })).toBe(false);
    expect(options.retry(0, { status: 410 })).toBe(false);
    expect(options.retry(0, { status: 500 })).toBe(true);
  });

  it('uses a shared reviewer key and can defer fetching until the modal opens', () => {
    const options = aiStrategyReviewerQueryOptions({ enabled: false });

    expect(options.queryKey).toEqual(['ai-strategies', 'reviewers']);
    expect(options.enabled).toBe(false);
  });
});
