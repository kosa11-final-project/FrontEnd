import { requestJson } from '@/shared/api';
import { mapExampleListResponse } from '../model/exampleMapper.js';

/** 실제 slice로 복사한 뒤 endpoint와 mapper 필드를 백엔드 계약에 맞춥니다. */
export async function getExamples(params, signal) {
  const response = await requestJson({
    method: 'get',
    path: 'v1/examples',
    params,
    signal,
  });

  return mapExampleListResponse(response);
}
