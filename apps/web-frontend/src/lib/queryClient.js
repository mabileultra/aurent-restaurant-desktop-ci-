import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { formatApiErrorMessage } from '../utils/apiErrorParser';
import { isApiNetworkError, notifyNetworkOffline } from '../utils/apiNetworkError';
import { useNetworkStore, ConnectionStatus } from '../store/networkStore';
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
        return;
      }
      if (query?.meta?.errorMessage) {
        toast.error(query.meta.errorMessage);
      } else if (query?.meta?.showToastOnError) {
        toast.error(formatApiErrorMessage(error));
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      const isNetError = isApiNetworkError(error);
      if (isNetError) {
        notifyNetworkOffline(error);
      }

      // Faqatgina internet yo'qligi aniq tasdiqlangan holatda (OFFLINE banner ko'rsatilayotganda)
      // ortiqcha takroriy toast xabari bostiriladi.
      const isConfirmedOffline = useNetworkStore.getState().status === ConnectionStatus.OFFLINE;
      if (isNetError && isConfirmedOffline) {
        return;
      }

      if (mutation?.meta?.suppressGlobalError) return;

      if (mutation?.meta?.errorMessage) {
        toast.error(mutation.meta.errorMessage);
        return;
      }

      const message = formatApiErrorMessage(error) || "Saqlanmadi, qayta urinib ko'ring";
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
    mutations: {
      networkMode: 'always',
    },
  },
});
