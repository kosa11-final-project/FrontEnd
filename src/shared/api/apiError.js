export class ApiError extends Error {
  constructor(message, { status, code, details, cause } = {}) {
    super(message, { cause });
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function normalizeApiError(error) {
  if (error instanceof ApiError) return error;

  const response = error?.response;
  const details = response?.data ?? error?.data;
  const status = response?.status ?? error?.response?.status;
  const code = details?.code;
  const message = details?.message || error?.message || '요청을 처리하지 못했습니다.';

  return new ApiError(message, { status, code, details, cause: error });
}
