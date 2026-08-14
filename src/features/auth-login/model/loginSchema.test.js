import { describe, expect, it } from 'vitest';
import { loginSchema } from './loginSchema.js';

describe('loginSchema', () => {
  it('trims the login ID while preserving the password', () => {
    expect(loginSchema.parse({ loginId: '  greenfood-admin  ', password: ' password ' })).toEqual({
      loginId: 'greenfood-admin',
      password: ' password ',
    });
  });

  it('requires both login fields', () => {
    const result = loginSchema.safeParse({ loginId: ' ', password: '' });

    expect(result.success).toBe(false);
    expect(result.error.flatten().fieldErrors).toEqual({
      loginId: ['아이디를 입력해 주세요.'],
      password: ['비밀번호를 입력해 주세요.'],
    });
  });
});
