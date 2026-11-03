import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LastUpdatedBadge from './LastUpdatedBadge';

describe('LastUpdatedBadge', () => {
  it('renders formatted time correctly when timestamp is provided', () => {
    const fixedDate = new Date(2026, 10, 2, 14, 32);
    const html = renderToStaticMarkup(
      React.createElement(LastUpdatedBadge, { timestamp: fixedDate })
    );

    expect(html).toContain('14:32');
    expect(html).toContain('Oxirgi yangilanish:');
  });

  it('returns nothing (null) when timestamp is missing to avoid fake time', () => {
    const html1 = renderToStaticMarkup(React.createElement(LastUpdatedBadge));
    expect(html1).toBe('');

    const html2 = renderToStaticMarkup(React.createElement(LastUpdatedBadge, { timestamp: null }));
    expect(html2).toBe('');

    const html3 = renderToStaticMarkup(React.createElement(LastUpdatedBadge, { timestamp: 0 }));
    expect(html3).toBe('');
  });
});
