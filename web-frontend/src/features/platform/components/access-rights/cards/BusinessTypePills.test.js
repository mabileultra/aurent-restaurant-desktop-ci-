import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import BusinessTypePills from './BusinessTypePills';

globalThis.React = React;

describe('BusinessTypePills', () => {
  it('renders business type buttons with active status', () => {
    const list = [
      { code: 'RESTAURANT', name: 'Restoran', totalEmployees: 145 },
      { code: 'PHARMACY', name: 'Dorixona', totalEmployees: 19 },
    ];

    const html = renderToStaticMarkup(
      React.createElement(BusinessTypePills, {
        businessTypes: list,
        selectedCode: 'RESTAURANT',
        onSelect: () => {},
      })
    );

    expect(html).toContain('Restoran');
    expect(html).toContain('145 xodim');
    expect(html).toContain('Dorixona');
    expect(html).toContain('19 xodim');
    expect(html).toContain('aria-selected="true"');
  });

  it('does not render 0 xodim or count text when totalEmployees is null', () => {
    const list = [
      { code: 'RESTAURANT', name: 'Restoran', totalEmployees: 145 },
      { code: 'PHARMACY', name: 'Dorixona', totalEmployees: null },
    ];

    const html = renderToStaticMarkup(
      React.createElement(BusinessTypePills, {
        businessTypes: list,
        selectedCode: 'RESTAURANT',
        onSelect: () => {},
      })
    );

    expect(html).toContain('Restoran');
    expect(html).toContain('145 xodim');
    expect(html).toContain('Dorixona');
    expect(html).not.toContain('null xodim');
    expect(html).not.toContain('Dorixona (0 xodim)');
  });
});
