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

function unwrapApiData(response) {
  return response?.data ?? response;
}

export async function getAiStrategyReviewers(signal) {
  const response = await getJson({
    path: `${aiStrategyPath}/reviewers`,
    signal,
  });
  const data = unwrapApiData(response);

  if (!Array.isArray(data?.reviewers)) {
    throw new Error('Reviewer 목록 응답 형식이 올바르지 않습니다.');
  }

  return data.reviewers.map((reviewer) => {
    if (!Number.isInteger(reviewer?.reviewerId) || !reviewer?.reviewerName || !reviewer?.email) {
      throw new Error('Reviewer 목록 응답 형식이 올바르지 않습니다.');
    }
    return {
      reviewerId: reviewer.reviewerId,
      reviewerName: reviewer.reviewerName,
      email: reviewer.email,
      organizationName: reviewer.organizationName ?? '',
      roleName: reviewer.roleName ?? '',
    };
  });
}

export async function sendAiStrategyTeamsRequest(strategyCaseId, payload, signal) {
  if (!payload?.optionId || !Array.isArray(payload.reviewerIds) || payload.reviewerIds.length === 0) {
    throw new Error('최종 전략과 Reviewer를 한 명 이상 선택해 주세요.');
  }

  const response = await postJson({
    path: `${aiStrategyPath}/${strategyCaseId}/teams-requests`,
    body: payload,
    signal,
  });
  const data = unwrapApiData(response);

  if (
    !Number.isInteger(data?.strategyCaseId) ||
    !data?.selectedOptionId ||
    !data?.caseStatus ||
    !data?.deliveryStatus ||
    !Array.isArray(data?.reviewers)
  ) {
    throw new Error('Teams 검토 요청 결과를 확인할 수 없습니다.');
  }

  const reviewers = data.reviewers.map((reviewer) => {
    if (!Number.isInteger(reviewer?.reviewerId) || !['SENT', 'FAILED'].includes(reviewer?.deliveryStatus)) {
      throw new Error('Teams 검토 요청 결과를 확인할 수 없습니다.');
    }
    return {
      reviewerId: reviewer.reviewerId,
      reviewerName: reviewer.reviewerName ?? '',
      email: reviewer.email ?? '',
      deliveryStatus: reviewer.deliveryStatus,
      failureCode: reviewer.failureCode ?? null,
    };
  });

  return { ...data, reviewers };
}

export async function adjustAiStrategySimulation(strategyCaseId, candidateId, payload, signal) {
  const response = await postJson({
    path: `${aiStrategyPath}/${strategyCaseId}/candidates/${encodeURIComponent(candidateId)}/simulations`,
    body: payload,
    signal,
  });

  if (
    !response?.data?.adjustedConditions ||
    !response?.data?.adjustmentConstraints ||
    !response?.data?.chartRange ||
    !response?.data?.simulation
  ) {
    throw new Error('AI 전략 조정 시뮬레이션 결과를 확인할 수 없습니다.');
  }
  return response.data;
}
