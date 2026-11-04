import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformDesktopExtendConfirmModal from './PlatformDesktopExtendConfirmModal';

globalThis.React = React;

describe('PlatformDesktopExtendConfirmModal', () => {
  const baseProps = {
    t: (key, fallback) => {
      if (typeof fallback === 'string') return fallback;
      if (fallback?.defaultValue) return fallback.defaultValue;
      return key;
    },
    extendConfirmItem: {
      id: 'item-1',
      title: 'Xizmat yangilanishi',
      body: 'Ertaga soat 02:00 da texnik ishlar olib boriladi',
      kind: 'ALERT',
    },
    setExtendConfirmItem: vi.fn(),
    handleConfirmExtend: vi.fn(),
  };

  it('renders null when extendConfirmItem is null', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformDesktopExtendConfirmModal, { p: { ...baseProps, extendConfirmItem: null } })
    );
    expect(html).toBe('');
  });

  it('renders modal with title, body, and action buttons when open', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformDesktopExtendConfirmModal, { p: baseProps })
    );

    expect(html).toContain('Xizmat yangilanishi');
    expect(html).toContain('Ertaga soat 02:00');
    expect(html).toContain('24 soatga uzaytirish');
    expect(html).toContain('Bekor qilish');
  });
});
