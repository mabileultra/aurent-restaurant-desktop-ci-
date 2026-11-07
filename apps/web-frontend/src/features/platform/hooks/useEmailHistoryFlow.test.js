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

  it('initializes with empty history rows by default', () => {
    let state;
    renderHookHelper({}, (s) => { state = s; });

    expect(state.rows.length).toBe(0);
    expect(state.totalCount).toBe(0);
    expect(state.selectedRow).toBeNull();
    expect(state.paginationLabel).toBe('0 ta xabar');
    expect(state.canNext).toBe(false);
    expect(state.canPrev).toBe(false);
  });

  it('supports initialRows option with pagination and stats', () => {
    const mockRows = Array.from({ length: 8 }, (_, i) => ({
      id: `m${i}`,
      type: i % 2 === 0 ? 'bulk' : 'login',
      subject: `Mavzu ${i}`,
      audience: 'Barcha',
      total: 10,
      ok: 9,
      fail: 1,
      queued: 0,
      time: 'Bugun',
      sender: 'Admin',
    }));

    let state;
    renderHookHelper({ initialRows: mockRows }, (s) => { state = s; });

    expect(state.rows.length).toBe(5);
    expect(state.totalCount).toBe(8);
    expect(state.selectedRow).toBeTruthy();
    expect(state.paginationLabel).toBe('1–5 / 8 ta xabar');
    expect(state.canNext).toBe(true);
    expect(state.canPrev).toBe(false);

    state.handleRetryFails(mockRows[0].id);
  });

  it('handles search and returns null selectedRow when no match is found', () => {
    let state;
    renderHookHelper({ initialSearch: 'bu_mavzu_mavjud_emas_xyz' }, (s) => { state = s; });

    expect(state.rows).toHaveLength(0);
    expect(state.selectedRow).toBeNull();
    expect(state.paginationLabel).toBe('0 ta xabar');
  });
});
