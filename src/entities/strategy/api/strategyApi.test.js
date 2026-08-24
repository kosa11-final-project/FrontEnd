import { beforeEach, describe, expect, it, vi } from 'vitest';
import { postJson } from '@/shared/api';
import { createAiStrategyCase } from './strategyApi.js';

vi.mock('@/shared/api', () => ({
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
});
