import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ViloyatHeroBackground from './ViloyatHeroBackground';

describe('ViloyatHeroBackground', () => {
  it('keeps all layers mounted without transition classes', () => {
    const html = renderToStaticMarkup(
      React.createElement(ViloyatHeroBackground, { activeType: 'A' })
    );
    expect(html).toContain('grocery.jpg');
    expect(html).toContain('restaurant.jpg');
    expect(html).toContain('pharmacy.jpg');
    expect(html).toContain('iso-cubes');
    expect(html).not.toContain('transition-all');
    expect(html).not.toContain('duration-700');
  });

  it('shows grocery layer for type F', () => {
    const html = renderToStaticMarkup(
      React.createElement(ViloyatHeroBackground, { activeType: 'F' })
    );
    expect(html).toContain('data-hero="grocery"');
    expect(html).toContain('opacity-100');
  });

  it('shows restaurant layer for type R', () => {
    const html = renderToStaticMarkup(
      React.createElement(ViloyatHeroBackground, { activeType: 'R' })
    );
    expect(html).toContain('data-hero="restaurant"');
  });

  it('shows pharmacy layer for type P', () => {
    const html = renderToStaticMarkup(
      React.createElement(ViloyatHeroBackground, { activeType: 'P' })
    );
    expect(html).toContain('data-hero="pharmacy"');
  });

  it('shows isometric layer for type O', () => {
    const html = renderToStaticMarkup(
      React.createElement(ViloyatHeroBackground, { activeType: 'O' })
    );
    expect(html).toContain('data-hero="other"');
    expect(html).toContain('iso-cubes');
  });
});
