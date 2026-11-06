import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDesktopNotificationHistoryList } from './useDesktopNotificationHistoryList';

globalThis.React = React;

vi.mock('../../../api', () => ({
  platformDesktopNotificationsApi: {
    list: vi.fn().mockResolvedValue({
      data: [
        { id: 1, title: 'Notice 1', body: 'Body 1', active: true, targetType: 'ALL' },
        { id: 2, title: 'Notice 2', body: 'Body 2', active: false, targetType: 'ALL' },
      ],
    }),
  },
}));

describe('useDesktopNotificationHistoryList', () => {
  it('initializes and provides history list and status filter', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    let hookResult;
    function Consumer() {
      hookResult = useDesktopNotificationHistoryList({
        t: (k, opts) => opts?.defaultValue || k,
      });
      return React.createElement('div', null, hookResult.statusFilter);
    }

    renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(Consumer)
      )
    );

    expect(hookResult.statusFilter).toBe('ALL');
    expect(hookResult.searchQuery).toBe('');
    expect(Array.isArray(hookResult.history)).toBe(true);
  });
});
