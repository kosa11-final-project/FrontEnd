import { describe, expect, it } from 'vitest';
import {
  parseStrategyExecutionPage,
  STRATEGY_EXECUTION_PAGE_SIZE,
  toStrategyExecutionQueryParams,
} from './filterState.js';

describe('strategy execution filter state', () => {
  it('parses a one-based UI page and normalizes invalid values to the first page', () => {
    expect(parseStrategyExecutionPage(new URLSearchParams('page=3'))).toBe(3);
    expect(parseStrategyExecutionPage(new URLSearchParams())).toBe(1);
    expect(parseStrategyExecutionPage(new URLSearchParams('page='))).toBe(1);
    expect(parseStrategyExecutionPage(new URLSearchParams('page=0'))).toBe(1);
    expect(parseStrategyExecutionPage(new URLSearchParams('page=wrong'))).toBe(1);
  });

  it('converts the UI page and supported filters to backend query parameters', () => {
    expect(
      toStrategyExecutionQueryParams(
        { strategyStatus: 'EXECUTING', actionType: 'RT_TRANSFER', query: '  SC-2026  ' },
        3,
      ),
    ).toEqual({
      page: 2,
      size: STRATEGY_EXECUTION_PAGE_SIZE,
      query: 'SC-2026',
      status: 'EXECUTING',
      actionType: 'RT_TRANSFER',
    });
  });

  it('sends price discount as a supported backend action filter', () => {
    expect(
      toStrategyExecutionQueryParams({ strategyStatus: 'ALL', actionType: 'PRICE_DISCOUNT', query: '' }, 1),
    ).toEqual({ page: 0, size: STRATEGY_EXECUTION_PAGE_SIZE, actionType: 'PRICE_DISCOUNT' });
  });

  it('does not send unsupported status, action type, or empty search parameters', () => {
    expect(
      toStrategyExecutionQueryParams({ strategyStatus: 'FAILED', actionType: 'UNKNOWN', query: '   ' }, 1),
    ).toEqual({ page: 0, size: 10 });
  });

  it('caps normalized search text at the backend maximum length', () => {
    expect(
      toStrategyExecutionQueryParams({ strategyStatus: 'ALL', actionType: 'ALL', query: `  ${'가'.repeat(101)}  ` }, 1)
        .query,
    ).toHaveLength(100);
  });
});
