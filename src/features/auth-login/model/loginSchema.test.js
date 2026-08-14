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

  it('accepts 100 characters and rejects 101 characters for loginId', () => {
    expect(loginSchema.safeParse({ loginId: 'a'.repeat(100), password: 'password' }).success).toBe(true);

    const result = loginSchema.safeParse({ loginId: 'a'.repeat(101), password: 'password' });
    expect(result.success).toBe(false);
    expect(result.error.flatten().fieldErrors.loginId).toEqual(['아이디는 100자 이하여야 합니다.']);
  });
});
