import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { cacheAuthenticatedUser, isAuthenticationError, login as loginWithSession } from '@/entities/auth';
import { Alert, Button, Input } from '@/shared/ui';
import { loginSchema } from '../model/loginSchema.js';

// 백엔드는 계정 없음·비밀번호 오류·비활성 계정을 AUTH-001 하나로 응답하므로 화면에서도 구분하지 않음
function getLoginErrorMessage(error) {
  if (isAuthenticationError(error)) return '아이디 또는 비밀번호를 확인해 주세요.';
  return '로그인 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';
}

export function LoginForm({ onSuccess }) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { loginId: '', password: '' },
  });

  const loginMutation = useMutation({
    // TanStack Query가 넘기는 mutation context를 API의 AbortSignal 인자로 잘못 전달하지 않도록 명시적으로 감쌈
    mutationFn: (credentials) => loginWithSession(credentials),
    onSuccess: async (user) => {
      // 로그인 응답은 /me와 같은 사용자 모델이므로 기존 Query를 취소한 뒤 캐시에 바로 기록함
      await cacheAuthenticatedUser(queryClient, user);
      onSuccess?.(user);
    },
  });

  const loginIdField = register('loginId');
  const passwordField = register('password');

  // 사용자가 값을 다시 입력하면 직전 서버 오류를 지워 새 시도와 혼동되지 않게 함
  function clearServerError() {
    if (loginMutation.isError) loginMutation.reset();
  }

  return (
    <form className="grid gap-5" noValidate onSubmit={handleSubmit((values) => loginMutation.mutate(values))}>
      <div className="grid gap-2">
        <label
          className="text-[length:var(--font-size-body-sm)] font-[var(--font-weight-semibold)] text-[color:var(--text-heading)]"
          htmlFor="login-id"
        >
          아이디
        </label>
        <Input
          {...loginIdField}
          id="login-id"
          autoComplete="username"
          autoFocus
          size="lg"
          placeholder="아이디를 입력해 주세요"
          tone={errors.loginId ? 'error' : 'default'}
          aria-invalid={Boolean(errors.loginId)}
          aria-describedby={errors.loginId ? 'login-id-error' : undefined}
          onChange={(event) => {
            loginIdField.onChange(event);
            clearServerError();
          }}
        />
        {errors.loginId ? (
          <p id="login-id-error" className="text-[length:var(--font-size-body-sm)] text-[color:var(--danger)]">
            {errors.loginId.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label
          className="text-[length:var(--font-size-body-sm)] font-[var(--font-weight-semibold)] text-[color:var(--text-heading)]"
          htmlFor="login-password"
        >
          비밀번호
        </label>
        <div className="relative">
          <Input
            {...passwordField}
            id="login-password"
            type={isPasswordVisible ? 'text' : 'password'}
            autoComplete="current-password"
            size="lg"
            placeholder="비밀번호를 입력해 주세요"
            tone={errors.password ? 'error' : 'default'}
            className="pr-16"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
            onChange={(event) => {
              passwordField.onChange(event);
              clearServerError();
            }}
          />
          <button
            className="absolute inset-y-0 right-0 px-3 text-[length:var(--font-size-body-sm)] font-[var(--font-weight-semibold)] text-[color:var(--primary)]"
            type="button"
            aria-label={isPasswordVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
            aria-pressed={isPasswordVisible}
            onClick={() => setIsPasswordVisible((visible) => !visible)}
          >
            {isPasswordVisible ? '숨기기' : '보기'}
          </button>
        </div>
        {errors.password ? (
          <p id="login-password-error" className="text-[length:var(--font-size-body-sm)] text-[color:var(--danger)]">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      {loginMutation.isError ? (
        <Alert variant="danger" title="로그인할 수 없습니다.">
          {getLoginErrorMessage(loginMutation.error)}
        </Alert>
      ) : null}

      <Button className="mt-1 w-full" size="lg" type="submit" disabled={loginMutation.isPending}>
        {loginMutation.isPending ? '로그인 중...' : '로그인'}
      </Button>
    </form>
  );
}
