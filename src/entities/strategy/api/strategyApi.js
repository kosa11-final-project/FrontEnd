import { postJson } from '@/shared/api';

const aiStrategyPath = 'v1/ai-strategies';

export async function createAiStrategyCase(payload, signal) {
  const response = await postJson({
    path: aiStrategyPath,
    body: payload,
    signal,
  });
  const data = response?.data;

  if (!data?.strategyCaseId) {
    throw new Error('AI 전략 생성 요청 결과를 확인할 수 없습니다.');
  }

  return data;
}
