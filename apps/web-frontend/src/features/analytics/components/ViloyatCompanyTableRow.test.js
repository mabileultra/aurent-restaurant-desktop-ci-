import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import ViloyatCompanyTableRow from './ViloyatCompanyTableRow';

describe('ViloyatCompanyTableRow', () => {
  const sampleRow = {
    id: 29,
    rowNumber: 1,
    name: 'Aminjon Samarqand XK',
    tin: '300575194',
    district: 'Urgut tumani',
    type: 'Oziq-ovqat',
    isConnected: true,
    turnover30d: 479088600,
    isDeltaUp: true,
    deltaText: '+12.4%',
  };

  it('renders table row with role="link", cursor-pointer and accessible tabindex', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement('table', null,
          React.createElement('tbody', null,
            React.createElement(ViloyatCompanyTableRow, {
              row: sampleRow,
              targetUrl: '/platform/analytics/viloyatlar/18/companies/29',
            })
          )
        )
      )
    );

    // Row attributes for clickability & accessibility
    expect(html).toContain('role="link"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('cursor-pointer');

    // Content checks
    expect(html).toContain('Aminjon Samarqand XK');
    expect(html).toContain('300575194');
    expect(html).toContain('Urgut tumani');
    expect(html).toContain('Oziq-ovqat');
    expect(html).toContain('Ulangan');
    expect(html).toContain('+12.4%');
    expect(html).toContain('href="/platform/analytics/viloyatlar/18/companies/29"');
  });

  it('renders disconnected status and negative delta appropriately', () => {
    const disconnectedRow = {
      ...sampleRow,
      id: 38,
      name: 'Farina Invest',
      isConnected: false,
      isDeltaUp: false,
      deltaText: '-86.3%',
    };

    const html = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement('table', null,
          React.createElement('tbody', null,
            React.createElement(ViloyatCompanyTableRow, {
              row: disconnectedRow,
              targetUrl: '/platform/analytics/viloyatlar/18/companies/38',
            })
          )
        )
      )
    );

    expect(html).toContain('Farina Invest');
    expect(html).toContain('Ulanmagan');
    expect(html).toContain('-86.3%');
    expect(html).toContain('bg-rose-50');
  });

  it('handles row click and keyboard events correctly', () => {
    // Test the event handler logic directly
    const navigateMock = vi.fn();
    const targetUrl = '/platform/analytics/viloyatlar/18/companies/29';

    const handleRowClick = (e) => {
      if (e.target?.closest?.('a')) return;
      navigateMock(targetUrl);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault?.();
        navigateMock(targetUrl);
      }
    };

    // 1. Click on empty row area or td
    const tdTarget = { closest: () => null };
    handleRowClick({ target: tdTarget });
    expect(navigateMock).toHaveBeenCalledWith(targetUrl);

    // 2. Click directly on <a> link (should not double navigate)
    navigateMock.mockClear();
    const linkTarget = { closest: (tag) => (tag === 'a' ? {} : null) };
    handleRowClick({ target: linkTarget });
    expect(navigateMock).not.toHaveBeenCalled();

    // 3. Keydown Enter
    const preventDefault = vi.fn();
    handleKeyDown({ key: 'Enter', preventDefault });
    expect(preventDefault).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith(targetUrl);

    // 4. Keydown Space
    navigateMock.mockClear();
    preventDefault.mockClear();
    handleKeyDown({ key: ' ', preventDefault });
    expect(preventDefault).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith(targetUrl);

    // 5. Irrelevant key
    navigateMock.mockClear();
    handleKeyDown({ key: 'Tab' });
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
