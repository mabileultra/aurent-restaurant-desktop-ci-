import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import TablePagination from './TablePagination';

globalThis.React = React;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => {
      if (key === 'products.recordsRange') {
        return `Yozuvlar ${opts.from} – ${opts.to} / ${opts.total}`;
      }
      return key;
    },
  }),
}));

describe('TablePagination', () => {
  it('calculates range based on page when displayPage is not passed', () => {
    const html = renderToStaticMarkup(
      React.createElement(TablePagination, {
        page: 0,
        pageSize: 14,
        total: 42,
        totalPages: 3,
        onPageChange: vi.fn(),
      })
    );

    expect(html).toContain('Yozuvlar 1 – 14 / 42');
  });

  it('calculates range based on displayPage when displayPage is provided during background transitions', () => {
    const html = renderToStaticMarkup(
      React.createElement(TablePagination, {
        page: 1, // Target page requested (page 2)
        displayPage: 0, // Currently visible data is still page 1
        pageSize: 14,
        total: 42,
        totalPages: 3,
        onPageChange: vi.fn(),
      })
    );

    // Range must reflect displayPage (1 – 14), NOT page 1 (15 – 28)
    expect(html).toContain('Yozuvlar 1 – 14 / 42');
    expect(html).not.toContain('Yozuvlar 15 – 28');
  });

  it('updates range to target page once data is refreshed and displayPage matches page', () => {
    const html = renderToStaticMarkup(
      React.createElement(TablePagination, {
        page: 1,
        displayPage: 1,
        pageSize: 14,
        total: 42,
        totalPages: 3,
        onPageChange: vi.fn(),
      })
    );

    expect(html).toContain('Yozuvlar 15 – 28 / 42');
  });

  it('handles empty total without division or NaN errors', () => {
    const html = renderToStaticMarkup(
      React.createElement(TablePagination, {
        page: 0,
        displayPage: 0,
        pageSize: 14,
        total: 0,
        totalPages: 1,
        onPageChange: vi.fn(),
      })
    );

    expect(html).toContain('Yozuvlar 0 – 0 / 0');
  });
});
