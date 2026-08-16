import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// 각 테스트 후 DOM 렌더링 결과 자동 cleanup
afterEach(() => {
  cleanup();
});
