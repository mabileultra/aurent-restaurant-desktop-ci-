import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RoleCard from './RoleCard';

globalThis.React = React;

describe('RoleCard', () => {
  it('renders role card with percentage and breakdown properly', () => {
    const mockRole = {
      code: 'MANAGER',
      name: 'Menejer',
      totalEmployees: 9,
      exceptionCount: 2,
      enabledModulesCount: 54,
      totalModulesCount: 59,
      breakdown: [
        { name: 'Asosiy', enabled: 2, total: 3 },
        { name: 'Moliya', enabled: 8, total: 10 },
      ],
    };

    const html = renderToStaticMarkup(
      React.createElement(RoleCard, {
        role: mockRole,
        onConfigure: () => {},
        onViewEmployees: () => {},
      })
    );

    expect(html).toContain('Menejer');
    expect(html).toContain('9 xodim');
    expect(html).toContain('2 istisno');
    expect(html).toContain('54');
    expect(html).toContain('59 modul');
    expect(html).toContain('92%');
    expect(html).toContain('Asosiy');
    expect(html).toContain('2/3');
    expect(html).toContain('Moliya');
    expect(html).toContain('8/10');
    expect(html).toContain('Sozlash');
    expect(html).toContain('Xodimlar');
  });

  it('renders compact mode for roles with 0 employees', () => {
    const mockRole = {
      code: 'COOK',
      name: 'Oshpaz',
      totalEmployees: 0,
      exceptionCount: 0,
      enabledModulesCount: 1,
      totalModulesCount: 8,
      breakdown: [],
    };

    const html = renderToStaticMarkup(
      React.createElement(RoleCard, {
        role: mockRole,
        isCompact: true,
        onConfigure: () => {},
        onViewEmployees: () => {},
      })
    );

    expect(html).toContain('Oshpaz');
    expect(html).toContain('0 xodim');
    expect(html).toContain('1/8 modul');
    expect(html).toContain('Ko‘rish');
  });
});
