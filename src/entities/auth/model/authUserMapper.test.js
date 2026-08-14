import { describe, expect, it } from 'vitest';
import { mapAuthUser } from './authUserMapper.js';

describe('mapAuthUser', () => {
  it('maps the session user response to the frontend model', () => {
    // 실제 계정이 아닌 매퍼의 필드 선택 동작을 확인하기 위한 테스트 전용 사용자
    expect(
      mapAuthUser({
        userId: 1,
        loginId: 'greenfood-admin',
        userName: '전체 총괄',
        email: 'admin@example.com',
        organizationId: 10,
        organizationName: '그린푸드',
        roleCode: 'GREENFOOD_ADMIN',
        // 예상하지 못한 민감정보가 응답에 포함돼도 매핑 결과에서 제외되는지 확인하기 위한 가상 값
        password: 'must-not-leak',
      }),
    ).toEqual({
      userId: 1,
      loginId: 'greenfood-admin',
      userName: '전체 총괄',
      email: 'admin@example.com',
      organizationId: 10,
      organizationName: '그린푸드',
      roleCode: 'GREENFOOD_ADMIN',
    });
  });

  it('returns null when no authenticated user exists', () => {
    expect(mapAuthUser(null)).toBeNull();
  });
});
