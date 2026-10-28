import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PharmacyIntegrationSettingsModal from './PharmacyIntegrationSettingsModal';

globalThis.React = React;

vi.mock('../../hooks/usePharmacyIntegrationSettings', () => ({
  usePharmacyIntegrationSettings: ({ store, open }) => ({
    t: (key) => key,
    form: { dmedEnabled: true, dmedExternalId: '123' },
    updateField: vi.fn(),
    isLoading: false,
    saving: false,
    submit: vi.fn(),
  }),
}));

describe('PharmacyIntegrationSettingsModal', () => {
  const mockStore = {
    id: 10,
    name: 'Dorixona 1',
    businessType: 'PHARMACY',
  };

  it('renders nothing when open is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(PharmacyIntegrationSettingsModal, {
        open: false,
        store: mockStore,
        onClose: vi.fn(),
      })
    );
    expect(html).toBe('');
  });

  it('renders full-screen backdrop with z-[1000] and bg-black/60 when open is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(PharmacyIntegrationSettingsModal, {
        open: true,
        store: mockStore,
        onClose: vi.fn(),
      })
    );

    expect(html).toContain('fixed inset-0 z-[1000]');
    expect(html).toContain('bg-black/60');
    expect(html).toContain('Dorixona 1');
  });
});
