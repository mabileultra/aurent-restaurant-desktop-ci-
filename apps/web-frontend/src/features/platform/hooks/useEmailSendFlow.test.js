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
  it('initializes with default role mode and empty subject by default', () => {
    let state;
    function TestComponent() {
      state = useEmailSendFlow();
      return null;
    }

    renderToStaticMarkup(React.createElement(TestComponent));

    expect(state.mode).toBe('role');
    expect(state.subjectLength).toBe(0);
    expect(state.device).toBe('desktop');
    expect(state.isConfirmOpen).toBe(false);
  });

  it('updates audience mode, toggles roles, and manages confirmation modal', () => {
    let state;
    function TestComponent() {
      state = useEmailSendFlow();
      return null;
    }

    renderToStaticMarkup(React.createElement(TestComponent));

    state.setMode('all');
    state.toggleRole('CASHIER');
    state.setSubject('Yangi test mavzu');
    state.setMessage('Test xabari');
    state.insertVariable('{{recipientName}}');
    state.setDevice('mobile');
    state.openConfirm();
    state.closeConfirm();
    state.handleConfirmSend();
  });
});
