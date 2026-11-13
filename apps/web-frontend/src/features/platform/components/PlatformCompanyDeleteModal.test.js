import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformCompanyDeleteModal from './PlatformCompanyDeleteModal';

globalThis.React = React;

describe('PlatformCompanyDeleteModal', () => {
  const mockT = (key, opts) => opts?.defaultValue || key;

  it('renders company name and prevents hard delete when stores are attached', () => {
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
        t: mockT,
      })
    );

    expect(html).toContain('Rayhon Milliy Taomlar');
    expect(html).toContain('ID: #42');
    expect(html).toContain('3 ta savdo do‘koni (filial)');
    // Safe deactivation button present
    expect(html).toContain('Faolsizlantirish');
    // Hard delete button must NOT be rendered when stores exist
    expect(html).not.toContain('common.delete');
  });

  it('allows delete when company has 0 stores', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompanyDeleteModal, {
        open: true,
        company: {
          id: 55,
          name: 'Empty Company',
          storeCount: 0,
          active: false,
        },
        t: mockT,
      })
    );

    expect(html).toContain('Empty Company');
    expect(html).toContain('allaqachon nofaol');
    expect(html).toContain('Faollashtirish');
    expect(html).toContain('O‘chirish');
  });
});
