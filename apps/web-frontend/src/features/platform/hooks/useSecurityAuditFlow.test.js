import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { useSecurityAuditFlow } from './useSecurityAuditFlow';

globalThis.React = React;

describe('useSecurityAuditFlow', () => {
  it('filters audit rows by module and selects rows', () => {
    let state;
    function TestComponent() {
      state = useSecurityAuditFlow();
      return React.createElement('div', null, state.filteredRows.length);
    }

    renderToStaticMarkup(React.createElement(TestComponent));

    expect(state.selectedModule).toBe('all');
    expect(state.filteredRows.length).toBeGreaterThan(0);
    expect(state.selectedItem).toBeTruthy();

    state.setSelectedModule('security');
    state.selectRow(state.filteredRows[0].id);
    expect(state.selectedId).toBe(state.filteredRows[0].id);
  });
});
