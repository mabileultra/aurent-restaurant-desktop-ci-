import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDesktopNotificationTargeting } from './useDesktopNotificationTargeting';

globalThis.React = React;

describe('useDesktopNotificationTargeting', () => {
  it('initializes with ALL scope and hasValidTarget=true', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    let hookResult;
    function Consumer() {
      hookResult = useDesktopNotificationTargeting();
      return React.createElement('div', null, hookResult.targetScope);
    }

    renderToStaticMarkup(
      React.createElement(QueryClientProvider, { client: queryClient },
        React.createElement(Consumer)
      )
    );

    expect(hookResult.targetScope).toBe('ALL');
    expect(hookResult.hasValidTarget).toBe(true);
    expect(hookResult.selectedTargetCount).toBeNull();
  });
});
