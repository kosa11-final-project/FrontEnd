import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getJson, postJson } from '@/shared/api';
import { createAiStrategyCase, getAiStrategyCases, serializeAiStrategyListParams } from './strategyApi.js';

vi.mock('@/shared/api', () => ({
  getJson: vi.fn(),
  postJson: vi.fn(),
}));

describe('AI strategy API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends a strategy case creation request and unwraps the API response', async () => {
    postJson.mockResolvedValue({
      data: {
        strategyCaseId: 123,
        caseName: '테스트 전략',
        caseStatus: 'GENERATING',
        generationStage: null,
        createdAt: '2026-08-24T10:00:00',
      },
    });
    const payload = {
      caseName: '테스트 전략',
      skuId: 1001,
      sourceSalesPointId: null,
      lotIds: null,
      candidateSalesPointIds: null,
      strategyTypes: null,
      preferredStartDate: null,
      preferredEndDate: null,
    };

    await expect(createAiStrategyCase(payload)).resolves.toMatchObject({
      strategyCaseId: 123,
      caseStatus: 'GENERATING',
    });
    expect(postJson).toHaveBeenCalledWith({
      path: 'v1/ai-strategies',
      body: payload,
      signal: undefined,
    });
  });

  it('rejects an invalid creation response', async () => {
    postJson.mockResolvedValue({ data: {} });

    await expect(createAiStrategyCase({ skuId: 1001 })).rejects.toThrow('AI 전략 생성 요청 결과를 확인할 수 없습니다.');
  });

  it('serializes list filters while removing empty values and ALL status', () => {
    expect(
      serializeAiStrategyListParams({
        page: 0,
        size: 10,
        status: 'ALL',
        query: '  만두  ',
        from: '',
        to: '2026-08-24',
        sort: 'createdAt,desc',
      }),
    ).toEqual({ page: 0, size: 10, query: '만두', to: '2026-08-24', sort: 'createdAt,desc' });
  });

  it('fetches and maps the backend strategy case list', async () => {
    const signal = new AbortController().signal;
    getJson.mockResolvedValue({
      data: {
        content: [
          {
            strategyCaseId: 3787,
            caseName: '치즈쭈욱 떡볶이 AI 전략',
            caseStatus: 'GENERATED',
            generationStage: 'COMPARISON_READY',
            sku: {
              skuId: 11842,
              skuCode: 'SKU002562',
              skuName: '치즈쭈욱 떡볶이',
              imageUrl: null,
              category: { categoryId: 301, categoryName: '간편식', categoryLevel: 3 },
            },
            requester: { userId: 17, userName: '이주영' },
            createdAt: '2026-08-24T14:32:00',
            completedAt: '2026-08-24T14:34:20',
            resultExpiresAt: '2026-08-27T14:34:20',
            failure: null,
          },
        ],
        statusCounts: { all: 1, generating: 0, generated: 1, generationFailed: 0 },
        page: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
      },
    });

    await expect(getAiStrategyCases({ page: 0, size: 10, status: 'GENERATED' }, signal)).resolves.toMatchObject({
      content: [
        expect.objectContaining({
          id: 3787,
          strategyNumber: '#3787',
          caseStatus: 'GENERATED',
          requester: { userId: 17, userName: '이주영' },
        }),
      ],
      totalElements: 1,
    });
    expect(getJson).toHaveBeenCalledWith({
      path: 'v1/ai-strategies',
      params: { page: 0, size: 10, status: 'GENERATED' },
      signal,
    });
  });

  it('rejects an invalid list response', async () => {
    getJson.mockResolvedValue({ data: { content: {}, page: 0 } });

    await expect(getAiStrategyCases()).rejects.toThrow('AI 전략 생성 목록 응답 형식이 올바르지 않습니다.');
  });
});
