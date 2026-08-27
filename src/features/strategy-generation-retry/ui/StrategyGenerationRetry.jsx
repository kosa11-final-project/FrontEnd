import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Refresh } from 'reicon-react';
import { aiStrategyKeys, retryAiStrategyGeneration } from '@/entities/strategy';
import { Button, Icon, toast } from '@/shared/ui';
import { StrategyRetryDialog } from './StrategyRetryDialog.jsx';

const DATE_ADJUSTMENT_CODE = 'AI_STRATEGY_RETRY_DATE_ADJUSTMENT_REQUIRED';
const PERIOD_EXPIRED_CODE = 'AI_STRATEGY_RETRY_PERIOD_EXPIRED';
const CONDITIONS_STALE_CODES = new Set(['AI_STRATEGY_RETRY_CONDITIONS_STALE', 'AI_STRATEGY_RETRY_REFERENCE_CHANGED']);

const errorMessages = Object.freeze({
  AI_STRATEGY_RETRY_NOT_ALLOWED:
    '현재 상태에서는 AI 전략 생성을 재시도할 수 없습니다.\n목록을 새로고침하여 최신 상태를 확인해 주세요.',
  AI_STRATEGY_RETRY_FORBIDDEN: '이 AI 전략을 재시도할 권한이 없습니다.',
  AI_STRATEGY_CASE_NOT_FOUND: 'AI 전략 정보를 찾을 수 없습니다.\n목록을 새로고침해 주세요.',
  AI_STRATEGY_RETRY_PAYLOAD_INVALID:
    '기존 요청 정보를 복원할 수 없어 재시도할 수 없습니다.\nIT 담당자에게 문의해 주세요.',
});

function getErrorDetails(error) {
  return error?.details?.details ?? error?.details ?? {};
}

function getUnknownErrorMessage(error) {
  if (error?.status >= 400 && error?.status < 500 && error?.message) return error.message;
  return 'AI 전략 생성 재시도를 요청하지 못했습니다. 잠시 후 다시 시도해 주세요.';
}

export function StrategyGenerationRetry({ strategyCaseId, caseStatus, onSucceeded, onNavigateInventory }) {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState(null);
  const inFlightRef = useRef(false);
  const retryMutation = useMutation({
    mutationFn: (dateAdjustmentPolicy) =>
      retryAiStrategyGeneration({
        strategyCaseId,
        dateAdjustmentPolicy,
      }),
    onSuccess: (result) => {
      setDialog(null);
      void queryClient.invalidateQueries({ queryKey: aiStrategyKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: aiStrategyKeys.detail(strategyCaseId), exact: true });

      const description = result.reusedExistingRetry
        ? '이미 재시도된 AI 전략이 있습니다.\n해당 전략으로 이동합니다.'
        : result.dateAdjustment.applied
          ? '판매 시작일을 오늘 날짜로 변경하여\nAI 전략 생성을 다시 요청했습니다.'
          : 'AI 전략 생성을 다시 요청했습니다.';
      toast({ title: 'AI 전략 재시도', description });
      onSucceeded?.(result);
    },
    onError: (error) => {
      if (error?.code === DATE_ADJUSTMENT_CODE) {
        setDialog({ kind: 'DATE_ADJUSTMENT', details: getErrorDetails(error) });
        return;
      }
      if (error?.code === PERIOD_EXPIRED_CODE) {
        setDialog({ kind: 'PERIOD_EXPIRED' });
        return;
      }
      if (CONDITIONS_STALE_CODES.has(error?.code)) {
        setDialog({ kind: 'CONDITIONS_STALE' });
        return;
      }

      setDialog(null);
      if (['AI_STRATEGY_RETRY_NOT_ALLOWED', 'AI_STRATEGY_CASE_NOT_FOUND'].includes(error?.code)) {
        void queryClient.invalidateQueries({ queryKey: aiStrategyKeys.lists() });
        void queryClient.invalidateQueries({ queryKey: aiStrategyKeys.detail(strategyCaseId), exact: true });
      }
      toast({
        title: 'AI 전략을 재시도할 수 없습니다.',
        description: errorMessages[error?.code] ?? getUnknownErrorMessage(error),
        variant: 'destructive',
      });
    },
    onSettled: () => {
      inFlightRef.current = false;
    },
  });

  if (caseStatus !== 'GENERATION_FAILED') return null;

  function requestRetry(policy) {
    if (inFlightRef.current || retryMutation.isPending) return;
    inFlightRef.current = true;
    retryMutation.mutate(policy);
  }

  function navigateInventory() {
    setDialog(null);
    onNavigateInventory?.();
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        disabled={retryMutation.isPending}
        onClick={() => requestRetry('REJECT')}
      >
        <Icon
          icon={Refresh}
          size={17}
          className={retryMutation.isPending ? 'motion-safe:animate-spin' : undefined}
          aria-hidden="true"
        />
        {retryMutation.isPending ? '재시도 요청 중' : '전략 생성 재시도'}
      </Button>

      {dialog ? (
        <StrategyRetryDialog
          dialog={dialog}
          isPending={retryMutation.isPending}
          onClose={() => setDialog(null)}
          onConfirm={() => requestRetry('ADJUST_TO_TODAY')}
          onNavigateInventory={navigateInventory}
        />
      ) : null}
    </>
  );
}
