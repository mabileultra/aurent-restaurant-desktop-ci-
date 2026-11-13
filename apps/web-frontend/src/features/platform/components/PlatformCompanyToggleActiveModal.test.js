import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformCompanyToggleActiveModal from './PlatformCompanyToggleActiveModal';

globalThis.React = React;

describe('PlatformCompanyToggleActiveModal', () => {
  it('renders deactivation warning and danger confirmation button when company is active', () => {
    const company = { id: 127, name: 'Dorixona Plyus', active: true, loginCode: 'DP-127', storeCount: 2 };
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompanyToggleActiveModal, {
        open: true,
        company,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
      })
    );

    expect(html).toContain('Kompaniyani faolsizlantirish');
    expect(html).toContain('Dorixona Plyus');
    expect(html).toContain('ID <span class="font-mono">127</span>');
    expect(html).toContain('kirish kodi <span class="font-mono">DP-127</span>');
    expect(html).toContain('Filiallar va kassalar to‘xtaydi');
    expect(html).toContain('2 ta filial');
    expect(html).toContain('Faolsizlantirish');
    expect(html).not.toContain('Ha, faolsizlantirish');
  });

  it('renders activation confirmation when company is inactive', () => {
    const company = { id: 127, name: 'Dorixona Plyus', active: false, loginCode: 'DP-127' };
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompanyToggleActiveModal, {
        open: true,
        company,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
      })
    );

    expect(html).toContain('Kompaniyani faollashtirish');
    expect(html).toContain('kassalar va filiallar tizimga qayta ulanadi');
    expect(html).toContain('Faollashtirish');
    expect(html).not.toContain('Ha, faollashtirish');
  });
});
