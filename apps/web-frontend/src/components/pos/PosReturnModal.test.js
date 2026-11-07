import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PosReturnModal from './PosReturnModal';

globalThis.React = React;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

vi.mock('../shared/PosModalPortal', () => ({
  default: ({ open, children }) => (open ? React.createElement('div', { 'data-testid': 'portal' }, children) : null),
}));

describe('PosReturnModal', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const renderModal = (props = {}) => {
    return renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(PosReturnModal, {
          open: true,
          onClose: vi.fn(),
          onSuccess: vi.fn(),
          ...props,
        })
      )
    );
  };

  it('renders modal structure with header and search section when open', () => {
    const html = renderModal();
    expect(html).toContain('pos-return-modal');
    expect(html).toContain('pos.returnTitle');
    expect(html).toContain('pos.returnHint');
    expect(html).toContain('pos.returnReceipt');
    expect(html).toContain('pos.returnReceiptPrefix');
    expect(html).toContain('pos.returnSearchPrompt');
  });

  it('renders cancel and confirm action buttons in footer', () => {
    const html = renderModal();
    expect(html).toContain('pos-return-modal__footer');
    expect(html).toContain('common.cancel');
    expect(html).toContain('pos.returnConfirm');
  });

  it('does not render modal content when open is false', () => {
    const html = renderModal({ open: false });
    expect(html).toBe('');
  });
});
