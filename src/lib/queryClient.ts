import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays fresh for 60 seconds — no refetch on revisit within that window
      staleTime: 60_000,
      // Keep data in memory for 5 minutes after component unmounts (instant back-nav)
      gcTime: 5 * 60_000,
      // Don't spam retries on network errors
      retry: 1,
      // Don't refetch just because the user switched browser tabs
      refetchOnWindowFocus: false,
    },
  },
});
