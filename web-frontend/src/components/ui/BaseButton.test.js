import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import BaseButton from './BaseButton';

globalThis.React = React;

describe('BaseButton', () => {
  it('renders standard button with children', () => {
    const html = renderToStaticMarkup(
      React.createElement(BaseButton, { variant: 'primary' }, 'Saqlash')
    );
    expect(html).toContain('Saqlash');
    expect(html).toContain('base-btn--primary');
  });

  it('renders spinner and disables button when loading is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(BaseButton, { variant: 'primary', loading: true }, 'Saqlash')
    );
    expect(html).toContain('disabled=""');
    expect(html).toContain('animate-spin');
    expect(html).toContain('animate-pulse');
    expect(html).toContain('text-white');
  });
});
