import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import AnimatedCheckbox19 from './AnimatedCheckbox19';

describe('AnimatedCheckbox19 Component', () => {
  it('renders correctly with checked=false', () => {
    const html = renderToStaticMarkup(
      React.createElement(AnimatedCheckbox19, {
        checked: false,
        size: 20,
        ariaLabel: 'Toggle Permission',
      })
    );

    expect(html).toContain('checkbox-wrapper-19');
    expect(html).toContain('check-box');
    expect(html).toContain('--checkbox-height:20px');
    expect(html).not.toContain('checked=""');
    expect(html).not.toContain('check-box checked');
  });

  it('renders checked attribute and class when checked=true', () => {
    const html = renderToStaticMarkup(
      React.createElement(AnimatedCheckbox19, {
        checked: true,
        size: 25,
      })
    );

    expect(html).toContain('checked=""');
    expect(html).toContain('check-box checked');
    expect(html).toContain('--checkbox-height:25px');
  });

  it('applies disabled state when disabled=true', () => {
    const html = renderToStaticMarkup(
      React.createElement(AnimatedCheckbox19, {
        checked: false,
        disabled: true,
      })
    );

    expect(html).toContain('checkbox-wrapper-19--disabled');
    expect(html).toContain('disabled=""');
  });

  it('includes aria-label and title when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(AnimatedCheckbox19, {
        ariaLabel: 'Module Access',
        title: 'Modul huquqi',
      })
    );

    expect(html).toContain('aria-label="Module Access"');
    expect(html).toContain('title="Modul huquqi"');
  });
});
