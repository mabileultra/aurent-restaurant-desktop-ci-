import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { useSecurityAuditFlow } from './useSecurityAuditFlow';

globalThis.React = React;

describe('useSecurityAuditFlow', () => {
  it('initializes with empty audit list', () => {
    let state;
    function TestComponent() {
      state = useSecurityAuditFlow();
      return React.createElement('div', null, state.filteredRows.length);
    }

    renderToStaticMarkup(React.createElement(TestComponent));

    expect(state.selectedModule).toBe('all');
    expect(state.filteredRows).toEqual([]);
    expect(state.selectedItem).toBeNull();
    expect(state.selectedId).toBe('');

    state.setSelectedModule('security');
    state.selectRow('a1');
  });
});
