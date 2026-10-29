import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { formatApiErrorMessage } from '../utils/apiErrorParser';
import { isApiNetworkError, notifyNetworkOffline } from '../utils/apiNetworkError';
import { queryRetryDelay, shouldRetryQuery } from './queryRetry';

/**
 * Enterprise QueryClient configured with global error orchestration.
 * Automatically translates and alerts on failed mutations without boilerplate.
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (isApiNetworkError(error)) {
        notifyNetworkOffline(error);
      }
      // Background query error handling
      if (query?.meta?.errorMessage) {
        toast.error(query.meta.errorMessage);
      } else if (query?.meta?.showToastOnError) {
        toast.error(formatApiErrorMessage(error));
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (isApiNetworkError(error)) {
        notifyNetworkOffline(error);
      }
      // Opt-out flag for custom local handling (e.g. inline form errors)
      if (mutation?.meta?.suppressGlobalError) return;

      // Custom message override if provided in mutation meta
      if (mutation?.meta?.errorMessage) {
        toast.error(mutation.meta.errorMessage);
        return;
      }

      // Default: parse status/response message and show user-friendly notification
      const message = formatApiErrorMessage(error);
      toast.error(message);
    },
  }),
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
      retryDelay: queryRetryDelay,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});
