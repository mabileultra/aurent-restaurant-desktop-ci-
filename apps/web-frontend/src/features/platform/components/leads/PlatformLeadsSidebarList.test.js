import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformLeadsSidebarList from './PlatformLeadsSidebarList';

describe('PlatformLeadsSidebarList', () => {
  it('renders lead items with badges and snippets', () => {
    const leads = [
      {
        id: '1',
        name: 'Nodira Yusupova',
        status: 'NEW',
        leadType: 'CONNECT',
        source: 'pricing',
        message: 'Oziq-ovqat do\'koni, bitta filial',
        createdAt: new Date().toISOString(),
      },
    ];

    const html = renderToStaticMarkup(
      React.createElement(PlatformLeadsSidebarList, {
        leads,
        selectedId: '1',
        onSelectLead: vi.fn(),
      })
    );
    expect(html).toContain('Nodira Yusupova');
    expect(html).toContain('Oziq-ovqat');
  });
});
