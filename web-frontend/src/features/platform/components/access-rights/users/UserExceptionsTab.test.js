import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import UserExceptionsTab from './UserExceptionsTab';

globalThis.React = React;

describe('UserExceptionsTab', () => {
  it('renders employees list and user exceptions detail with formula', () => {
    const html = renderToStaticMarkup(React.createElement(UserExceptionsTab));

    expect(html).toContain('Dilnoza Rashidova');
    expect(html).toContain('Jasur Toshmatov');
    expect(html).toContain('Qo‘shimcha ruxsatlar');
    expect(html).toContain('Taqiqlar');
    expect(html).toContain('Natija:');
    expect(html).toContain('kirish bor');
  });
});
