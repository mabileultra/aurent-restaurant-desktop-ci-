import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RoleEmployeeEditGroupList from './RoleEmployeeEditGroupList';

describe('RoleEmployeeEditGroupList', () => {
  const sampleGroups = [
    {
      id: 'sales',
      title: 'Sotuv guruhi',
      modules: [
        { id: 'pos', name: 'Kassa moduli' },
        { id: 'orders', name: 'Buyurtmalar' },
      ],
    },
    {
      id: 'inventory',
      title: 'Ombor guruhi',
      modules: [
        { id: 'stock', name: 'Ombor qoldig‘i' },
      ],
    },
  ];

  it('renders groups and module items correctly in static markup', () => {
    const html = renderToStaticMarkup(
      React.createElement(RoleEmployeeEditGroupList, {
        catalogGroups: sampleGroups,
        moduleToggles: { pos: true, orders: false, stock: true },
        defaultsMap: new Map([['pos', true], ['orders', true], ['stock', false]]),
        filterMode: 'ALL',
        searchQuery: '',
      })
    );

    expect(html).toContain('Sotuv guruhi');
    expect(html).toContain('Kassa moduli');
    expect(html).toContain('Buyurtmalar');
    expect(html).toContain('Ombor guruhi');
    expect(html).toContain('Ombor qoldig‘i');
  });

  it('filters modules based on search query', () => {
    const html = renderToStaticMarkup(
      React.createElement(RoleEmployeeEditGroupList, {
        catalogGroups: sampleGroups,
        moduleToggles: { pos: true, orders: false, stock: true },
        defaultsMap: new Map(),
        filterMode: 'ALL',
        searchQuery: 'ombor',
      })
    );

    expect(html).not.toContain('Kassa moduli');
    expect(html).toContain('Ombor qoldig‘i');
  });

  it('filters enabled modules only when filterMode is ENABLED', () => {
    const html = renderToStaticMarkup(
      React.createElement(RoleEmployeeEditGroupList, {
        catalogGroups: sampleGroups,
        moduleToggles: { pos: true, orders: false, stock: false },
        defaultsMap: new Map(),
        filterMode: 'ENABLED',
        searchQuery: '',
      })
    );

    expect(html).toContain('Kassa moduli');
    expect(html).not.toContain('Buyurtmalar');
    expect(html).not.toContain('Ombor qoldig‘i');
  });
});
