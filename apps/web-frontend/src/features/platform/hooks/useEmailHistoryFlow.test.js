import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { useEmailHistoryFlow } from './useEmailHistoryFlow';

globalThis.React = React;

describe('useEmailHistoryFlow', () => {
  function renderHookHelper(options, onState) {
    function TestComponent() {
      const state = useEmailHistoryFlow(options);
      onState(state);
      return React.createElement('div', null, state.selectedRow?.id || 'none');
    }
    renderToStaticMarkup(React.createElement(TestComponent));
  }

  it('initializes with default history rows, pagination and stats', () => {
    let state;
    renderHookHelper({}, (s) => { state = s; });

    expect(state.rows.length).toBe(5); // PAGE_SIZE is 5
    expect(state.totalCount).toBe(8);
    expect(state.selectedRow).toBeTruthy();
    expect(state.paginationLabel).toBe('1–5 / 8 ta xabar');
    expect(state.canNext).toBe(true);
    expect(state.canPrev).toBe(false);
  });

  it('handles search and returns null selectedRow when no match is found', () => {
    let state;
    renderHookHelper({ initialSearch: 'bu_mavzu_mavjud_emas_xyz' }, (s) => { state = s; });

    expect(state.rows).toHaveLength(0);
    expect(state.selectedRow).toBeNull();
    expect(state.paginationLabel).toBe('0 ta xabar');
  });

  it('handles retry fails correctly', () => {
    let state;
    renderHookHelper({}, (s) => { state = s; });
    const targetRow = state.allFilteredRows.find((r) => r.fail > 0);
    expect(targetRow).toBeDefined();

    state.handleRetryFails(targetRow.id);
  });
});
