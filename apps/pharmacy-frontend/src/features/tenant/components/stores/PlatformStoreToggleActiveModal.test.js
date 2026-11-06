import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformStoreToggleActiveModal from './PlatformStoreToggleActiveModal';

globalThis.React = React;

describe('PlatformStoreToggleActiveModal', () => {
  const t = (k, opts) => opts?.defaultValue || k;

  it('renders nothing when open is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformStoreToggleActiveModal, { open: false, store: { id: 1 }, t })
    );
    expect(html).toBe('');
  });

  it('renders deactivation warning and danger confirmation button when store is active', () => {
    const store = { id: 119, name: 'Chilonzor filiali', active: true, companyName: 'Market A' };
    const html = renderToStaticMarkup(
      React.createElement(PlatformStoreToggleActiveModal, { open: true, store, t })
    );

    expect(html).toContain('Chilonzor filiali');
    expect(html).toContain('Filialni faolsizlantirish');
    expect(html).toContain('barcha savdo kassalari va xodimlarning ushbu filialdagi amaliy faoliyati to‘xtatiladi');
    expect(html).toContain('Ha, faolsizlantirish');
  });

  it('renders activation prompt when store is inactive', () => {
    const store = { id: 119, name: 'Chilonzor filiali', active: false, companyName: 'Market A' };
    const html = renderToStaticMarkup(
      React.createElement(PlatformStoreToggleActiveModal, { open: true, store, t })
    );

    expect(html).toContain('Filialni faollashtirish');
    expect(html).toContain('Ha, faollashtirish');
  });
});
