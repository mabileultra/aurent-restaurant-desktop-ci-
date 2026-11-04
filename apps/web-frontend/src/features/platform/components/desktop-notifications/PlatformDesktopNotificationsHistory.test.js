import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformDesktopNotificationsHistory from './PlatformDesktopNotificationsHistory';

globalThis.React = React;

describe('PlatformDesktopNotificationsHistory', () => {
  const baseProps = {
    t: (k, opts) => opts?.defaultValue || k,
    i18n: { language: 'uz' },
    searchQuery: '',
    setSearchQuery: vi.fn(),
    statusFilter: 'ALL',
    setStatusFilter: vi.fn(),
    totalHistoryCount: 0,
    history: [],
    historyLoading: false,
    setSelectedItemForDrawer: vi.fn(),
    handleDuplicate: vi.fn(),
    handleExtend: vi.fn(),
    handleRevokePrompt: vi.fn(),
  };

  it('renders "historyEmpty" when totalHistoryCount is 0', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformDesktopNotificationsHistory, { p: baseProps })
    );

    expect(html).toContain('platform.desktopNotifications.historyEmpty');
    expect(html).not.toContain('Mos keladigan xabarlar topilmadi');
  });

  it('renders "Mos keladigan xabarlar topilmadi" when filter returns empty results but totalHistoryCount > 0', () => {
    const filterEmptyProps = {
      ...baseProps,
      statusFilter: 'ACTIVE',
      totalHistoryCount: 6,
      history: [],
    };

    const html = renderToStaticMarkup(
      React.createElement(PlatformDesktopNotificationsHistory, { p: filterEmptyProps })
    );

    expect(html).toContain('Mos keladigan xabarlar topilmadi');
    expect(html).not.toContain('platform.desktopNotifications.historyEmpty');
  });

  it('renders history items in table and mobile list when history is present', () => {
    const listProps = {
      ...baseProps,
      totalHistoryCount: 1,
      history: [
        {
          id: 'msg-1',
          title: 'Texnik ishlar',
          body: 'Kassa yangilanadi',
          kind: 'MESSAGE',
          status: 'ACTIVE',
          targetLabel: 'Barcha kassalar',
          createdAt: new Date().toISOString(),
          deliveredCount: 5,
          totalCount: 10,
          readCount: 3,
          readPercent: 30,
        },
      ],
    };

    const html = renderToStaticMarkup(
      React.createElement(PlatformDesktopNotificationsHistory, { p: listProps })
    );

    expect(html).toContain('Texnik ishlar');
    expect(html).toContain('Kassa yangilanadi');
  });
});
