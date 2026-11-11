import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TableLoadingOverlay from './TableLoadingOverlay';

describe('TableLoadingOverlay', () => {
  it('renders default loading text and aa-spinner class', () => {
    const html = renderToStaticMarkup(React.createElement(TableLoadingOverlay));
    expect(html).toContain('Yuklanmoqda…');
    expect(html).toContain('aa-spinner');
    expect(html).toContain('data-testid="table-loading-overlay"');
  });

  it('renders custom text when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(TableLoadingOverlay, { text: 'Yangilanmoqda…' })
    );
    expect(html).toContain('Yangilanmoqda…');
    expect(html).toContain('aa-spinner');
  });
});
