import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformAnalyticsBackground from './PlatformAnalyticsBackground';

describe('PlatformAnalyticsBackground', () => {
  it('renders fixed background container with Prism in normal mode', () => {
    const html = renderToStaticMarkup(React.createElement(PlatformAnalyticsBackground, { isAlert: false }));
    expect(html).toContain('fixed inset-0');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('prism-canvas');
    expect(html).not.toContain('pixel-snow-canvas');
    expect(html).toContain('opacity-95');
    expect(html).toContain('pointer-events-none');
  });

  it('renders alert mode with pixel snow visible', () => {
    const html = renderToStaticMarkup(React.createElement(PlatformAnalyticsBackground, { isAlert: true }));
    expect(html).toContain('pixel-snow-canvas');
    expect(html).toContain('opacity-100');
  });
});
