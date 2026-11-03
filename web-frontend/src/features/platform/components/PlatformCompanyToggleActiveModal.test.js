import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformCompanyToggleActiveModal from './PlatformCompanyToggleActiveModal';

globalThis.React = React;

describe('PlatformCompanyToggleActiveModal', () => {
  const mockT = (key, opts) => opts?.defaultValue || key;

  it('renders deactivation warning and danger confirmation button when company is active', () => {
    const company = { id: 127, name: 'Dorixona Plyus', active: true };
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompanyToggleActiveModal, {
        open: true,
        company,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
        t: mockT,
      })
    );

    expect(html).toContain('Kompaniyani faolsizlantirish');
    expect(html).toContain('Dorixona Plyus');
    expect(html).toContain('savdo kassalari dasturiy faoliyati to‘xtatiladi');
    expect(html).toContain('Ha, faolsizlantirish');
  });

  it('renders activation confirmation when company is inactive', () => {
    const company = { id: 127, name: 'Dorixona Plyus', active: false };
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompanyToggleActiveModal, {
        open: true,
        company,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
        t: mockT,
      })
    );

    expect(html).toContain('Kompaniyani faollashtirish');
    expect(html).toContain('kassalar va filiallar tizimga qayta ulanadi');
    expect(html).toContain('Ha, faollashtirish');
  });
});
