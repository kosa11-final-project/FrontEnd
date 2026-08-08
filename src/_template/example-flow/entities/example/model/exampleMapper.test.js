import { describe, expect, it } from 'vitest';
import { mapExampleListResponse, mapExampleResponse } from './exampleMapper.js';

describe('example mapper template', () => {
  it('백엔드 DTO를 프론트 도메인 이름으로 변환한다', () => {
    expect(mapExampleResponse({ exampleId: 7, exampleNm: '예시 항목', statusCd: 'ACTIVE' })).toEqual({
      id: '7',
      name: '예시 항목',
      status: 'active',
    });
  });

  it('Spring Page 형태를 목록과 pagination으로 분리한다', () => {
    expect(
      mapExampleListResponse({
        content: [{ exampleId: 1, exampleNm: '첫 번째', statusCd: 'PAUSED' }],
        number: 2,
        size: 20,
        totalElements: 45,
        totalPages: 3,
      }),
    ).toEqual({
      items: [{ id: '1', name: '첫 번째', status: 'paused' }],
      pagination: { page: 2, size: 20, totalElements: 45, totalPages: 3 },
    });
  });
});
