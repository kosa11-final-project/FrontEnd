import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'storybook-static/**',
      'playwright-report/**',
      'test-results/**',
      'public/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      ...reactHooks.configs.flat.recommended.plugins,
      ...reactRefresh.configs.vite.plugins,
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      ...reactRefresh.configs.vite.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // shadcn 방식은 컴포넌트와 variant를 같은 모듈에서 공개합니다.
      'react-refresh/only-export-components': 'off',
      // React Compiler를 사용하지 않으므로 TanStack Table의 compiler 호환 경고는 적용하지 않습니다.
      'react-hooks/incompatible-library': 'off',
    },
  },
];
