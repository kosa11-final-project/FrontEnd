/**
 * 백엔드 AuthUserResponse에서 화면에 사용할 공개 필드만 프론트 모델로 옮김
 * 응답에 필드가 추가되더라도 인증 객체에 불필요한 값이 섞이지 않도록 명시적으로 매핑함
 */
export function mapAuthUser(payload) {
  if (!payload) return null;

  return {
    userId: payload.userId,
    loginId: payload.loginId,
    userName: payload.userName,
    email: payload.email,
    organizationId: payload.organizationId,
    organizationName: payload.organizationName,
    roleCode: payload.roleCode,
  };
}
