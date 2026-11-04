import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PlatformStoreDeleteModal from './PlatformStoreDeleteModal';
import { userApi } from '../../../../api';

globalThis.React = React;

vi.mock('../../../../api', () => ({
  userApi: {
    listManaged: vi.fn(() => Promise.resolve({ data: { content: [] } })),
  },
}));

describe('PlatformStoreDeleteModal', () => {
  const t = (k, opts) => opts?.defaultValue || k;

  function renderWithQuery(ui) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return renderToStaticMarkup(
      React.createElement(QueryClientProvider, { client: qc }, ui)
    );
  }

  it('renders nothing when open is false', () => {
    const html = renderWithQuery(
      React.createElement(PlatformStoreDeleteModal, { open: false, store: { id: 119 }, t })
    );
    expect(html).toBe('');
  });

  it('renders store name and deactivation recommendation when no users attached', () => {
    const store = { id: 119, name: 'Chilonzor filiali', companyId: 10, companyName: 'Market A', active: true };
    const html = renderWithQuery(
      React.createElement(PlatformStoreDeleteModal, { open: true, store, t })
    );

    expect(html).toContain('Chilonzor filiali');
    expect(html).toContain('Filialni o‘chirish');
    expect(html).toContain('faolsizlantirishingiz');
    expect(html).toContain('O‘chirish');
  });

  it('displays user attachment guard warning and prevents deletion when users are assigned', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['store-users-check', 10, 119], {
      content: [
        { id: 1, fullName: 'Claudesinov Admin', storeIds: [119] },
      ],
    });

    const store = { id: 119, name: 'Chilonzor filiali', companyId: 10, companyName: 'Market A', active: true };
    const html = renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: qc },
        React.createElement(PlatformStoreDeleteModal, { open: true, store, t })
      )
    );

    expect(html).toContain('1 nafar xodim');
    expect(html).toContain('biriktirilgan');
    expect(html).toContain('Claudesinov Admin');
    // Hard delete button must be hidden when users are assigned
    expect(html).not.toContain('O‘chirish');
    // Deactivation button must be present
    expect(html).toContain('Faolsizlantirish');
  });
});
