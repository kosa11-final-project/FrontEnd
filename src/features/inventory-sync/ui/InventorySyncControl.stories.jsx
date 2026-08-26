import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { inventorySyncKeys } from '../model/inventorySyncQueries.js';
import { InventorySyncControl } from './InventorySyncControl.jsx';

const succeededRun = {
  syncRunId: 1042,
  status: 'SUCCEEDED',
  phase: 'DONE',
  triggerType: 'MANUAL',
  mainAttemptNo: 1,
  readCount: 33358,
  mappedCount: 33358,
  changedCount: 0,
  errorCount: 0,
  completedAt: '2026-08-24T09:42:00+09:00',
  snapshotRefresh: {
    required: false,
    dashboardReady: true,
    inventoryStatisticsReady: true,
  },
  sourceStates: [
    { sourceType: 'OFFLINE', currentRecordCount: 23392, pendingRecordCount: 0 },
    { sourceType: 'ECOMMERCE', currentRecordCount: 325, pendingRecordCount: 0 },
    { sourceType: 'GREETING', currentRecordCount: 1416, pendingRecordCount: 0 },
    { sourceType: 'WAREHOUSE', currentRecordCount: 8225, pendingRecordCount: 0 },
  ],
};

const failedRun = {
  syncRunId: 1043,
  status: 'FAILED',
  phase: 'CANONICAL',
  triggerType: 'MANUAL',
  mainAttemptNo: 2,
  readCount: 120,
  mappedCount: 118,
  changedCount: 17,
  errorCount: 2,
  errorCode: 'SYNC_FAILED',
  errorMessage: '위험 판정 저장 중 오류가 발생했습니다.',
  sourceRuns: [
    {
      sourceType: 'OFFLINE',
      status: 'SUCCEEDED',
      readCount: 100,
      mappedCount: 100,
      changedCount: 12,
      errorCount: 0,
    },
    {
      sourceType: 'WAREHOUSE',
      status: 'FAILED',
      readCount: 20,
      mappedCount: 18,
      changedCount: 5,
      errorCount: 2,
    },
  ],
};

const interruptedRun = {
  syncRunId: 1044,
  status: 'INTERRUPTED',
  phase: 'CANONICAL',
  triggerType: 'SCHEDULED',
  mainAttemptNo: 1,
  readCount: 12800,
  mappedCount: 12740,
  changedCount: 0,
  errorCount: 0,
};

function createStoryClient(run) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
      },
    },
  });

  client.setQueryData(inventorySyncKeys.latest(), run);
  if (run?.syncRunId) client.setQueryData(inventorySyncKeys.run(run.syncRunId), run);
  return client;
}

function SyncControlStory({ run }) {
  const [client] = useState(() => createStoryClient(run));

  return (
    <QueryClientProvider client={client}>
      <div
        className="w-[min(680px,calc(100vw-48px))] rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
        onClickCapture={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <InventorySyncControl />
      </div>
    </QueryClientProvider>
  );
}

const meta = {
  title: 'Features/Inventory/Sync Control',
  component: InventorySyncControl,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '통합재고 동기화 버튼과 실행 중 상태를 표시합니다. 완료·실패 결과는 전역 shadcn Toast로 안내하며, Storybook에서는 실제 실행 요청이 발생하지 않도록 상호작용을 차단합니다.',
      },
    },
  },
};

export default meta;

export const Succeeded = {
  render: () => <SyncControlStory run={succeededRun} />,
};

export const Failed = {
  render: () => <SyncControlStory run={failedRun} />,
};

export const RecoveryWaiting = {
  render: () => <SyncControlStory run={interruptedRun} />,
};
