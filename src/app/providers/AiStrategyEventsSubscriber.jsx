import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeAiStrategyEvents } from './aiStrategyEvents.js';

/** 인증 Layout의 수명 동안 AI 전략 생성 SSE 연결을 하나만 유지합니다. */
export function AiStrategyEventsSubscriber() {
  const queryClient = useQueryClient();

  useEffect(() => subscribeAiStrategyEvents({ queryClient }), [queryClient]);

  return null;
}
