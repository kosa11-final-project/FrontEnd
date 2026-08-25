import { getJson, postJson } from '@/shared/api';
import { mapAiStrategyDetailResponse } from '../model/strategyDetailMapper.js';
import { mapAiStrategyListResponse } from '../model/strategyListMapper.js';

const aiStrategyPath = 'v1/ai-strategies';

export function serializeAiStrategyListParams(params = {}) {
  const serialized = {};
  if (Number.isInteger(params.page) && params.page >= 0) serialized.page = params.page;
  if (Number.isInteger(params.size) && params.size > 0) serialized.size = params.size;
  if (params.status && params.status !== 'ALL') serialized.status = params.status;
  if (String(params.query ?? '').trim()) serialized.query = String(params.query).trim();
  if (params.from) serialized.from = params.from;
  if (params.to) serialized.to = params.to;
  if (params.sort) serialized.sort = params.sort;
  return serialized;
}

export async function getAiStrategyCases(params = {}, signal) {
  const response = await getJson({
    path: aiStrategyPath,
    params: serializeAiStrategyListParams(params),
    signal,
  });

  return mapAiStrategyListResponse(response);
}

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

export async function getAiStrategyCase(strategyCaseId, signal) {
  const response = await getJson({
    path: `${aiStrategyPath}/${strategyCaseId}`,
    signal,
  });

  return mapAiStrategyDetailResponse(response);
}

export async function adjustAiStrategySimulation(strategyCaseId, candidateId, payload, signal) {
  const response = await postJson({
    path: `${aiStrategyPath}/${strategyCaseId}/candidates/${encodeURIComponent(candidateId)}/simulations`,
    body: payload,
    signal,
  });

  if (!response?.data?.adjustedConditions || !response?.data?.simulation) {
    throw new Error('AI 전략 조정 시뮬레이션 결과를 확인할 수 없습니다.');
  }
  return response.data;
}
