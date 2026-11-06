import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import WaterRippleEffect from './WaterRippleEffect';

globalThis.React = React;

describe('WaterRippleEffect component', () => {
  it('renders a fixed pointer-events-none canvas overlay', () => {
    const html = renderToStaticMarkup(React.createElement(WaterRippleEffect));
    expect(html).toContain('<canvas');
    expect(html).toContain('pointer-events-none');
    expect(html).toContain('z-[99999]');
  });

  it('renders null when disabled is true', () => {
    const html = renderToStaticMarkup(React.createElement(WaterRippleEffect, { disabled: true }));
    expect(html).toBe('');
  });
});
