import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { useEmailSendFlow } from './useEmailSendFlow';

globalThis.React = React;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => opts?.defaultValue || key,
    i18n: { language: 'uz' },
  }),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useQuery: () => ({ data: null, isPending: false }),
    useMutation: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

describe('useEmailSendFlow', () => {
  it('initializes with default role mode and recipient calculations', () => {
    let state;
    function TestComponent() {
      state = useEmailSendFlow();
      return null;
    }

    renderToStaticMarkup(React.createElement(TestComponent));

    expect(state.mode).toBe('role');
    expect(state.recipientCount).toBeGreaterThan(0);
    expect(state.subjectLength).toBeGreaterThan(0);
    expect(state.device).toBe('desktop');
  });

  it('updates audience mode and toggles roles and users', () => {
    let state;
    function TestComponent() {
      state = useEmailSendFlow();
      return null;
    }

    renderToStaticMarkup(React.createElement(TestComponent));

    state.setMode('all');
    state.toggleRole('CASHIER');
    state.removeCompany('c1');
    state.toggleUserCheck('p1');
    state.toggleAllUsers(false);
    state.insertVariable('{{ism}}');
    state.setDevice('mobile');
    state.nextSample();
    state.prevSample();
    state.handleSend();
    state.handleTestEmail();
  });
});
