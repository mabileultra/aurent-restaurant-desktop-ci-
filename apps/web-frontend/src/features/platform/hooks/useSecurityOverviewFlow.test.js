import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { useSecurityOverviewFlow } from './useSecurityOverviewFlow';

globalThis.React = React;

describe('useSecurityOverviewFlow', () => {
  it('initializes with default KPIs, recommendations, and events', () => {
    let state;
    const onSelectTab = vi.fn();
    function TestComponent() {
      state = useSecurityOverviewFlow({ onSelectTab });
      return React.createElement('div', null, state.kpis.activeSessions.count);
    }

    renderToStaticMarkup(React.createElement(TestComponent));

    expect(state.kpis.activeSessions.count).toBe(4);
    expect(state.kpis.failedLogins.count).toBe(7);
    expect(state.recommendations.length).toBeGreaterThan(0);
    expect(state.loginBars.length).toBe(7);
    expect(state.recentEvents.length).toBeGreaterThan(0);
    expect(state.doneOpen).toBe(false);

    state.toggleDone();
    state.handleAction('rules');
    expect(onSelectTab).toHaveBeenCalledWith('rules');
  });
});
