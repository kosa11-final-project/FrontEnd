import { describe, expect, it } from 'vitest';
import { normalizeApiError } from './apiError.js';

describe('normalizeApiError', () => {
  it.each(['ECONNABORTED', 'ETIMEDOUT'])('normalizes %s as a request timeout', (code) => {
    const error = normalizeApiError({ code, message: 'timeout of 10000ms exceeded' });

    expect(error).toMatchObject({
      name: 'ApiError',
      code: 'REQUEST_TIMEOUT',
      message: '요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.',
    });
  });

  it('keeps a backend error code and message', () => {
    const error = normalizeApiError({
      response: { status: 503, data: { code: 'COMMON-006', message: '일시적인 오류입니다.' } },
    });

    expect(error).toMatchObject({ status: 503, code: 'COMMON-006', message: '일시적인 오류입니다.' });
  });
});
