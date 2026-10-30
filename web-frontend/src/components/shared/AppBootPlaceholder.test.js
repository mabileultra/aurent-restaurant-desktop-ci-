import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import AppBootPlaceholder from './AppBootPlaceholder';
import RouteFallback from '../../router/RouteFallback';

globalThis.React = React;

describe('AppBootPlaceholder & RouteFallback', () => {
  it('renders AppBootPlaceholder with light tone by default', () => {
    const html = renderToStaticMarkup(React.createElement(AppBootPlaceholder));
    expect(html).toContain('app-boot-placeholder');
    expect(html).toContain('app-boot-placeholder--light');
    expect(html).toContain('Aurent…');
  });

  it('renders AppBootPlaceholder with explicit dark tone', () => {
    const html = renderToStaticMarkup(React.createElement(AppBootPlaceholder, { tone: 'dark' }));
    expect(html).toContain('app-boot-placeholder--dark');
  });

  it('RouteFallback never returns null and renders AppBootPlaceholder', () => {
    const html = renderToStaticMarkup(React.createElement(RouteFallback));
    expect(html).not.toBe('');
    expect(html).toContain('app-boot-placeholder');
  });
});
