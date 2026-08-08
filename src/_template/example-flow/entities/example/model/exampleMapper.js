const statusMap = Object.freeze({
  ACTIVE: 'active',
  PAUSED: 'paused',
  INACTIVE: 'inactive',
});

function toSafeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

/** 백엔드 DTO 이름과 null 처리를 entity 경계에서 끝냅니다. */
export function mapExampleResponse(response = {}) {
  return {
    id: String(response.exampleId ?? ''),
    name: response.exampleNm?.trim() || '이름 없음',
    status: statusMap[response.statusCd] ?? 'inactive',
  };
}

/** Spring Page 구조를 UI가 사용하기 쉬운 목록과 pagination으로 분리합니다. */
export function mapExampleListResponse(response = {}) {
  const content = Array.isArray(response.content) ? response.content : [];

  return {
    items: content.map(mapExampleResponse),
    pagination: {
      page: toSafeNumber(response.number),
      size: toSafeNumber(response.size, 20),
      totalElements: toSafeNumber(response.totalElements),
      totalPages: toSafeNumber(response.totalPages),
    },
  };
}
