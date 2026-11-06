import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { useSecuritySessionsFlow } from './useSecuritySessionsFlow';

globalThis.React = React;

describe('useSecuritySessionsFlow', () => {
  it('filters login attempts and manages session closing', () => {
    let state;
    function TestComponent() {
      state = useSecuritySessionsFlow();
      return React.createElement('div', null, state.sessions.length);
    }

    renderToStaticMarkup(React.createElement(TestComponent));

    expect(state.filter).toBe('all');
    expect(state.sessions.length).toBeGreaterThan(0);
    expect(state.attempts.length).toBeGreaterThan(0);
    expect(state.pendingCloseSession).toBeNull();
    expect(state.isCloseAllPending).toBe(false);

    state.setFilter('ok');
    state.requestCloseSession(state.sessions[0]);
    state.cancelCloseSession();
    state.requestCloseAllOthers();
    state.cancelCloseAllOthers();
  });
});
