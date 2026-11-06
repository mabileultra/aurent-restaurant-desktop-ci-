import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { useSecurityRulesFlow } from './useSecurityRulesFlow';

globalThis.React = React;

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useQuery: () => ({ data: { updatedAt: '2026-11-06' }, isLoading: false, isPending: false }),
    useMutation: () => ({ mutate: vi.fn(), isPending: false }),
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

describe('useSecurityRulesFlow', () => {
  it('initializes rules and handles IP allowlist', () => {
    let state;
    function TestComponent() {
      state = useSecurityRulesFlow();
      return React.createElement('div', null, state.dirtyCount);
    }

    renderToStaticMarkup(React.createElement(TestComponent));

    expect(state.dirtyCount).toBe(0);
    expect(state.rules.ips.length).toBeGreaterThan(0);
    expect(state.canSaveCashierPw).toBe(false);

    state.setMinLen(14);
    state.resetRules();
    state.setNewIpAddr('10.0.0.1');
    state.addIp();
    state.removeIp(0);
    state.requestSaveRules();
  });
});
