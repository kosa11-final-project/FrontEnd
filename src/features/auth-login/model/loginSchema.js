import { z } from 'zod';

// 백엔드 JsonLoginAuthenticationFilter와 동일하게 아이디만 trim하고 비밀번호 원문은 유지함
export const loginSchema = z.object({
  loginId: z.string().trim().min(1, '아이디를 입력해 주세요.').max(100, '아이디는 100자 이하여야 합니다.'),
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
});
