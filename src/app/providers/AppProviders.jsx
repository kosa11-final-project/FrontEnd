import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/shared/ui';
import { SessionExpirationHandler } from './SessionExpirationHandler.jsx';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
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
