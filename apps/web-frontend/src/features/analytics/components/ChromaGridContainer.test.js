import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ChromaGridContainer from './ChromaGridContainer';

describe('ChromaGridContainer', () => {
  it('renders children with chroma-grid wrapper and custom styles', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        ChromaGridContainer,
        { className: 'test-grid-class', radius: 320 },
        React.createElement('div', { 'data-chroma-area': '' }, 'Card 1')
      )
    );

    expect(html).toContain('chroma-grid test-grid-class');
    expect(html).toContain('--chroma-r:320px');
    expect(html).toContain('Card 1');
  });
});
