import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ViloyatHeroBackground from './ViloyatHeroBackground';

describe('ViloyatHeroBackground', () => {
  it('renders composite strips for type A', () => {
    const html = renderToStaticMarkup(
      React.createElement(ViloyatHeroBackground, { activeType: 'A' })
    );
    expect(html).toContain('grocery.jpg');
    expect(html).toContain('restaurant.jpg');
    expect(html).toContain('pharmacy.jpg');
  });

  it('renders grocery image for type F', () => {
    const html = renderToStaticMarkup(
      React.createElement(ViloyatHeroBackground, { activeType: 'F' })
    );
    expect(html).toContain('grocery.jpg');
    expect(html).not.toContain('pharmacy.jpg');
  });

  it('renders restaurant image for type R', () => {
    const html = renderToStaticMarkup(
      React.createElement(ViloyatHeroBackground, { activeType: 'R' })
    );
    expect(html).toContain('restaurant.jpg');
    expect(html).not.toContain('grocery.jpg');
  });

  it('renders pharmacy image for type P', () => {
    const html = renderToStaticMarkup(
      React.createElement(ViloyatHeroBackground, { activeType: 'P' })
    );
    expect(html).toContain('pharmacy.jpg');
    expect(html).not.toContain('restaurant.jpg');
  });

  it('renders isometric pattern for type O', () => {
    const html = renderToStaticMarkup(
      React.createElement(ViloyatHeroBackground, { activeType: 'O' })
    );
    expect(html).toContain('iso-cubes');
    expect(html).not.toContain('grocery.jpg');
  });
});
