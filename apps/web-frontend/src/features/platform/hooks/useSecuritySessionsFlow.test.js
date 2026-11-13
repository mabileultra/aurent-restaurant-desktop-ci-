import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { useSecuritySessionsFlow } from './useSecuritySessionsFlow';

globalThis.React = React;

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useQuery: () => ({
      data: [],
      isLoading: false,
    }),
    useMutation: () => ({ mutate: vi.fn(), isPending: false }),
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

describe('useSecuritySessionsFlow', () => {
  it('initializes with empty sessions and attempts', () => {
    let state;
    function TestComponent() {
      state = useSecuritySessionsFlow();
      return React.createElement('div', null, state.sessions.length);
    }

    renderToStaticMarkup(React.createElement(TestComponent));

    expect(state.sessions).toEqual([]);
    expect(state.attempts).toEqual([]);
    expect(state.filter).toBe('all');
    expect(state.pendingCloseSession).toBeNull();
    expect(state.isCloseAllPending).toBe(false);

    state.setFilter('fail');
    state.requestCloseSession({ id: 's1' });
    state.cancelCloseSession();
    state.requestCloseAllOthers();
    state.cancelCloseAllOthers();
  });
});
