import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { LightTunnel } from './LightTunnel';

describe('LightTunnel', () => {
  it('renders container and canvas with default props', () => {
    const html = renderToStaticMarkup(
      React.createElement(LightTunnel, {
        cableColor: '#088d61',
        pulseColor: '#09f1a4',
        tunnelColor: '#0ad08e',
      })
    );

    expect(html).toContain('light-tunnel-container');
    expect(html).toContain('light-tunnel-canvas');
  });

  it('applies custom className and style', () => {
    const html = renderToStaticMarkup(
      React.createElement(LightTunnel, {
        className: 'custom-tunnel-bg',
        style: { width: '100%', height: '600px' },
      })
    );

    expect(html).toContain('custom-tunnel-bg');
    expect(html).toContain('width:100%');
    expect(html).toContain('height:600px');
  });
});
