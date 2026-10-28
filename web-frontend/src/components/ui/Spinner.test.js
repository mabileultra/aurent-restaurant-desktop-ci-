import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Spinner, { AurentBrandEmblem } from './Spinner';

globalThis.React = React;

describe('Spinner (Aurent Halo Orbit)', () => {
  it('renders default emerald halo orbit spinner with Aurent brand emblem and accessibility attributes', () => {
    const html = renderToStaticMarkup(React.createElement(Spinner, { size: 'md' }));
    expect(html).toContain('role="status"');
    expect(html).toContain('animate-spin');
    expect(html).toContain('animate-pulse');
    expect(html).toContain('text-emerald-500');
    expect(html).toContain('#10B981'); // Brand emerald color in SVG emblem
    expect(html).toContain('Yuklanmoqda…');
  });

  it('renders with custom text label underneath', () => {
    const html = renderToStaticMarkup(
      React.createElement(Spinner, { size: 'lg', text: 'To‘lov amalga oshirilmoqda…' })
    );
    expect(html).toContain('To‘lov amalga oshirilmoqda…');
    expect(html).toContain('text-slate-600');
  });

  it('renders micro core without overflowing on small button sizes (xs, sm)', () => {
    const html = renderToStaticMarkup(
      React.createElement(Spinner, { variant: 'white', size: 'xs' })
    );
    expect(html).toContain('text-white');
    expect(html).toContain('w-4 h-4');
  });

  it('supports hiding the logo if minimal ring is requested', () => {
    const html = renderToStaticMarkup(
      React.createElement(Spinner, { size: 'lg', showLogo: false })
    );
    expect(html).not.toContain('#10B981');
  });

  it('renders overlay mode with backdrop blur for cards or tables', () => {
    const html = renderToStaticMarkup(
      React.createElement(Spinner, { overlay: true })
    );
    expect(html).toContain('absolute inset-0');
    expect(html).toContain('backdrop-blur-xs');
  });

  it('renders fullScreen fixed viewport overlay with card wrapper', () => {
    const html = renderToStaticMarkup(
      React.createElement(Spinner, { fullScreen: true, size: 'xl', text: 'Aurent POS ishga tushmoqda…' })
    );
    expect(html).toContain('fixed inset-0');
    expect(html).toContain('z-50');
    expect(html).toContain('Aurent POS ishga tushmoqda…');
  });

  it('renders standalone AurentBrandEmblem component', () => {
    const html = renderToStaticMarkup(React.createElement(AurentBrandEmblem));
    expect(html).toContain('<svg');
    expect(html).toContain('fill="#10B981"');
  });
});
