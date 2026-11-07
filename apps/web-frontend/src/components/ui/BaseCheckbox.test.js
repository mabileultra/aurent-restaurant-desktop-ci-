import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import BaseCheckbox from './BaseCheckbox';

describe('BaseCheckbox Global Component', () => {
  it('renders correctly with default props', () => {
    const html = renderToStaticMarkup(
      React.createElement(BaseCheckbox, { id: 'test-cb' })
    );
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('id="test-cb"');
    expect(html).toContain('checkbox-wrapper-19');
    expect(html).toContain('check-box');
  });

  it('renders checked attribute and class when controlled checked=true', () => {
    const html = renderToStaticMarkup(
      React.createElement(BaseCheckbox, { id: 'test-cb', checked: true })
    );
    expect(html).toContain('checked=""');
    expect(html).toContain('class="check-box checked"');
  });

  it('supports uncontrolled defaultChecked', () => {
    const html = renderToStaticMarkup(
      React.createElement(BaseCheckbox, { id: 'test-cb', defaultChecked: true })
    );
    expect(html).toContain('checked=""');
  });

  it('renders label wrapper when label prop is provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(BaseCheckbox, { id: 'test-cb', label: 'Eslab qolish' })
    );
    expect(html).toContain('Eslab qolish');
    expect(html).toContain('<label');
  });

  it('applies disabled state correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(BaseCheckbox, { id: 'test-cb', disabled: true })
    );
    expect(html).toContain('disabled=""');
    expect(html).toContain('checkbox-wrapper-19--disabled');
  });

  it('forwards aria-label and custom attributes', () => {
    const html = renderToStaticMarkup(
      React.createElement(BaseCheckbox, {
        'aria-label': 'Tanlash',
        'data-testid': 'cb',
      })
    );
    expect(html).toContain('aria-label="Tanlash"');
    expect(html).toContain('data-testid="cb"');
  });
});
