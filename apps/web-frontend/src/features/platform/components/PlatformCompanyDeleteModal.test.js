import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformCompanyDeleteModal from './PlatformCompanyDeleteModal';

globalThis.React = React;

describe('PlatformCompanyDeleteModal', () => {
  it('renders cannot delete warning and deactivation action when stores are attached', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompanyDeleteModal, {
        open: true,
        company: {
          id: 42,
          name: 'Rayhon Milliy Taomlar',
          loginCode: 'RAYHON-01',
          storeCount: 3,
          active: true,
        },
      })
    );

    expect(html).toContain('Kompaniyani o‘chirib bo‘lmaydi');
    expect(html).toContain('Rayhon Milliy Taomlar');
    expect(html).toContain('ID <span class="font-mono">42</span>');
    expect(html).toContain('kirish kodi <span class="font-mono">RAYHON-01</span>');
    expect(html).toContain('Kompaniyaga 3 ta filial biriktirilgan');
    expect(html).toContain('Filiali bor kompaniyani o‘chirib bo‘lmaydi');
    expect(html).toContain('Faolsizlantirish');
    expect(html).not.toContain('O‘chirish');
  });

  it('allows delete when company has 0 stores', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompanyDeleteModal, {
        open: true,
        company: {
          id: 55,
          name: 'Empty Company',
          loginCode: 'EMP-55',
          storeCount: 0,
          active: false,
        },
      })
    );

    expect(html).toContain('Kompaniyani o‘chirish');
    expect(html).toContain('Empty Company');
    expect(html).toContain('Bu amalni qaytarib bo‘lmaydi');
    expect(html).toContain('Kompaniya va uning sozlamalari butunlay o‘chiriladi');
    expect(html).toContain('O‘chirish');
  });
});
