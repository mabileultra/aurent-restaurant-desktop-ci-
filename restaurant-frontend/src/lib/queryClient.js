import { QueryClient } from '@tanstack/react-query';
import { queryRetryDelay, shouldRetryQuery } from './queryRetry';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
      retryDelay: queryRetryDelay,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});
