import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import AccessRightsHistoryEmptyState from './AccessRightsHistoryEmptyState';

describe('AccessRightsHistoryEmptyState', () => {
  it('renders empty message and clear filters button when canClear is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(AccessRightsHistoryEmptyState, {
        canClear: true,
      })
    );

    expect(html).toContain('Tarix yozuvlari topilmadi');
    expect(html).toContain('Filtrlarni tozalash');
  });

  it('does not render clear button when canClear is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(AccessRightsHistoryEmptyState, {
        canClear: false,
      })
    );

    expect(html).toContain('Tarix yozuvlari topilmadi');
    expect(html).not.toContain('Filtrlarni tozalash');
  });
});
