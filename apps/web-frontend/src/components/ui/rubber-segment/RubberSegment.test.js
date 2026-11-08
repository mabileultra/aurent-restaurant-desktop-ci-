import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import RubberSegment from './RubberSegment';

describe('RubberSegment', () => {
  it('renders radio items and thumb wrapper', () => {
    const items = [
      { value: 'today', label: 'Bugun' },
      { value: '7d', label: '7 kun' },
      { value: '30d', label: '30 kun' },
    ];

    const html = renderToStaticMarkup(
      React.createElement(RubberSegment, {
        items,
        value: '7d',
        size: 'sm',
      })
    );

    expect(html).toContain('rubber-segment');
    expect(html).toContain('Bugun');
    expect(html).toContain('7 kun');
    expect(html).toContain('30 kun');
    expect(html).toContain('aria-checked="true"');
  });
});
