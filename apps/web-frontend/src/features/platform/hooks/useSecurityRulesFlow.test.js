import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { useSecurityRulesFlow } from './useSecurityRulesFlow';

globalThis.React = React;

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useQuery: () => ({
      data: { isSet: true, updatedAt: '2026-09-24T09:39:25.981382Z' },
      isLoading: false,
    }),
    useMutation: () => ({ mutate: vi.fn(), isPending: false }),
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

describe('useSecurityRulesFlow', () => {
  it('manages security rules form, dirty count, and cashier password state', () => {
    let state;
    function TestComponent() {
      state = useSecurityRulesFlow();
      return React.createElement('div', null, state.dirtyCount);
    }

    renderToStaticMarkup(React.createElement(TestComponent));

    expect(state.rules).toBeDefined();
    expect(state.dirtyCount).toBe(0);
    expect(state.canSaveCashierPw).toBe(false);

    state.setMinLen(12);
    state.addIp();
    state.resetRules();
    state.requestSaveRules();
    state.confirmSudoAndSave();
  });
});
