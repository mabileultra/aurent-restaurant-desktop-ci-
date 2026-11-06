import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { useEmailHistoryFlow } from './useEmailHistoryFlow';

globalThis.React = React;

describe('useEmailHistoryFlow', () => {
  it('initializes with default history rows and stats', () => {
    let state;
    function TestComponent() {
      state = useEmailHistoryFlow();
      return React.createElement('div', null, state.selectedRow?.id);
    }

    renderToStaticMarkup(React.createElement(TestComponent));

    expect(state.rows.length).toBeGreaterThan(0);
    expect(state.selectedRow.id).toBe('b1');
    expect(state.typeFilter).toBe('all');
    expect(state.stats.totalSent).toBeTruthy();
  });

  it('filters history rows by type', () => {
    let state;
    function TestComponent() {
      state = useEmailHistoryFlow();
      return null;
    }

    renderToStaticMarkup(React.createElement(TestComponent));

    state.setTypeFilter('login');

    // Re-render to observe state change
    function FilteredTestComponent() {
      state = useEmailHistoryFlow();
      return null;
    }
    renderToStaticMarkup(React.createElement(FilteredTestComponent));
  });

  it('handles retrying failed deliveries for a row', () => {
    let state;
    function TestComponent() {
      state = useEmailHistoryFlow();
      return null;
    }

    renderToStaticMarkup(React.createElement(TestComponent));
    const targetRow = state.rows.find((r) => r.fail > 0);
    expect(targetRow).toBeDefined();

    state.handleRetryFails(targetRow.id);
  });
});
