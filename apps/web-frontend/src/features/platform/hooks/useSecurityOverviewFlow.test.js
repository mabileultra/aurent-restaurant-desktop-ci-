import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { useSecurityOverviewFlow } from './useSecurityOverviewFlow';

globalThis.React = React;

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useQuery: () => ({
      data: { configured: true, updatedAt: '2026-09-24T09:39:25.981382Z' },
      isLoading: false,
    }),
  };
});

describe('useSecurityOverviewFlow', () => {
  it('initializes with dynamic recommendations and clean states', () => {
    let state;
    const onSelectTab = vi.fn();
    function TestComponent() {
      state = useSecurityOverviewFlow({ onSelectTab });
      return React.createElement('div', null, state.kpis.activeSessions.count);
    }

    renderToStaticMarkup(React.createElement(TestComponent));

    expect(state.kpis.activeSessions.count).toBe('—');
    expect(state.kpis.failedLogins.count).toBe('—');
    expect(state.kpis.newDevices.count).toBe('—');
    expect(state.kpis.twoFactorEnabled.count).toBe('—');
    expect(state.recommendations.length).toBeGreaterThan(0);
    expect(state.loginBars).toEqual([]);
    expect(state.recentEvents).toEqual([]);
    expect(state.doneOpen).toBe(false);

    state.toggleDone();
    state.handleAction('rules');
    expect(onSelectTab).toHaveBeenCalledWith('rules');
  });
});
