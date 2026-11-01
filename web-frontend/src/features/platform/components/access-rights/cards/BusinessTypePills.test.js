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
});
