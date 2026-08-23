import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/shared/ui';
import { SessionExpirationHandler } from './SessionExpirationHandler.jsx';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // 페이지/필터 조합이 늘어도 비활성 query가 브라우저 메모리를
        // 무한히 점유하지 않도록 보존 상한을 둡니다.
        gcTime: 15 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: 0 },
    },
  });
}

export function AppProviders({ children }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionExpirationHandler />
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  );
}
