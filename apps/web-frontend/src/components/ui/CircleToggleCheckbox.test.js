import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import CircleToggleCheckbox from './CircleToggleCheckbox';

describe('CircleToggleCheckbox Component', () => {
  it('renders correctly with checked=false', () => {
    const html = renderToStaticMarkup(
      React.createElement(CircleToggleCheckbox, {
        checked: false,
        size: 24,
        ariaLabel: 'Toggle Access',
      })
    );

    expect(html).toContain('checkbox-wrapper-44');
    expect(html).toContain('toggleButton');
    expect(html).toContain('viewBox="0 0 44 44"');
    expect(html).toContain('M14,24 L21,31');
    expect(html).toContain('--cb-size:24px');
    expect(html).not.toContain('checked=""');
  });

  it('renders checked attribute when checked=true', () => {
    const html = renderToStaticMarkup(
      React.createElement(CircleToggleCheckbox, {
        checked: true,
        size: 32,
      })
    );

    expect(html).toContain('checked=""');
    expect(html).toContain('--cb-size:32px');
  });

  it('applies disabled class and attribute when disabled=true', () => {
    const html = renderToStaticMarkup(
      React.createElement(CircleToggleCheckbox, {
        checked: false,
        disabled: true,
      })
    );

    expect(html).toContain('checkbox-wrapper-44--disabled');
    expect(html).toContain('disabled=""');
  });

  it('includes aria-label and title when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(CircleToggleCheckbox, {
        ariaLabel: 'Kitchen TV',
        title: 'Oshxona TV',
      })
    );

    expect(html).toContain('aria-label="Kitchen TV"');
    expect(html).toContain('title="Oshxona TV"');
  });
});
