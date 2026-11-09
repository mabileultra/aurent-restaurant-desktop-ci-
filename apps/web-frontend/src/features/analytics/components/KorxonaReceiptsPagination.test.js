import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { KorxonaReceiptsPagination } from './KorxonaReceiptsPagination';

describe('KorxonaReceiptsPagination', () => {
  it('renders range and disabled Oldingi button on first page', () => {
    const html = renderToStaticMarkup(
      React.createElement(KorxonaReceiptsPagination, {
        page: 0,
        from: 1,
        to: 10,
        totalCount: 12,
        totalPages: 2,
        onPrevPage: vi.fn(),
        onNextPage: vi.fn(),
      })
    );

    expect(html).toContain('1–10 / 12 ta chek');
    expect(html).toContain('Oldingi');
    expect(html).toContain('Keyingi');
    expect(html).toContain('disabled=""');
  });

  it('renders range on second page', () => {
    const html = renderToStaticMarkup(
      React.createElement(KorxonaReceiptsPagination, {
        page: 1,
        from: 11,
        to: 12,
        totalCount: 12,
        totalPages: 2,
        onPrevPage: vi.fn(),
        onNextPage: vi.fn(),
      })
    );

    expect(html).toContain('11–12 / 12 ta chek');
  });

  it('renders 0 ta chek when totalCount is zero', () => {
    const html = renderToStaticMarkup(
      React.createElement(KorxonaReceiptsPagination, {
        page: 0,
        from: 0,
        to: 0,
        totalCount: 0,
        totalPages: 1,
      })
    );

    expect(html).toContain('0 ta chek');
  });
});
