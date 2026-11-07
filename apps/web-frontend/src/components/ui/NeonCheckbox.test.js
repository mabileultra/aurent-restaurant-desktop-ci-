import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import NeonCheckbox from './NeonCheckbox';

describe('NeonCheckbox Component', () => {
  it('renders correctly with checked=false', () => {
    const html = renderToStaticMarkup(
      React.createElement(NeonCheckbox, {
        checked: false,
        size: 20,
        ariaLabel: 'Test Checkbox',
      })
    );

    expect(html).toContain('neon-checkbox');
    expect(html).toContain('neon-checkbox__box');
    expect(html).toContain('neon-checkbox__check');
    expect(html).toContain('neon-checkbox__glow');
    expect(html).toContain('neon-checkbox__borders');
    expect(html).toContain('neon-checkbox__particles');
    expect(html).toContain('neon-checkbox__rings');
    expect(html).toContain('neon-checkbox__sparks');
    expect(html).toContain('--size:20px');
    expect(html).not.toContain('checked=""');
  });

  it('renders checked attribute when checked=true', () => {
    const html = renderToStaticMarkup(
      React.createElement(NeonCheckbox, {
        checked: true,
        size: 24,
      })
    );

    expect(html).toContain('checked=""');
    expect(html).toContain('--size:24px');
  });

  it('applies disabled class and attribute when disabled=true', () => {
    const html = renderToStaticMarkup(
      React.createElement(NeonCheckbox, {
        checked: false,
        disabled: true,
      })
    );

    expect(html).toContain('neon-checkbox--disabled');
    expect(html).toContain('disabled=""');
  });

  it('includes aria-label and title when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(NeonCheckbox, {
        ariaLabel: 'Dashboard Module',
        title: 'Yoqish yoki o‘chirish',
      })
    );

    expect(html).toContain('aria-label="Dashboard Module"');
    expect(html).toContain('title="Yoqish yoki o‘chirish"');
  });
});
