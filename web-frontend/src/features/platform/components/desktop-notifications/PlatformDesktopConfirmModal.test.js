import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformDesktopConfirmModal from './PlatformDesktopConfirmModal';

globalThis.React = React;

describe('PlatformDesktopConfirmModal', () => {
  const baseProps = {
    t: (key, fallback) => {
      if (typeof fallback === 'string') return fallback;
      if (fallback?.defaultValue) return fallback.defaultValue;
      if (key === 'platform.desktopNotifications.targetAll') return 'Barcha kassalar';
      if (key === 'platform.desktopNotifications.targetTypeCompanies') return 'Kompaniyalar bo‘yicha';
      if (key === 'platform.desktopNotifications.targetTypeStores') return 'Filiallar bo‘yicha';
      if (key === 'platform.desktopNotifications.allAssociatedRegisters') return 'barcha kassalari';
      return key;
    },
    confirmModalOpen: true,
    setConfirmModalOpen: vi.fn(),
    executeBroadcast: vi.fn(),
    sendPending: false,
    activeRegistersCount: 132,
    onlineRegistersCount: 18,
    targetScope: 'ALL',
    targetType: 'COMPANIES',
    selectedCompanyIds: [],
    selectedStoreIds: [],
    selectedCompanies: [],
    selectedStores: [],
    title: 'Test Title',
    body: 'Test Body',
    kind: 'MESSAGE',
    expiresInHours: 72,
    scheduleType: 'NOW',
    scheduledFormatted: null,
    visibleUntilFormatted: '3 kun',
  };

  it('renders ALL scope confirmation modal with active registers count', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformDesktopConfirmModal, { p: baseProps })
    );

    expect(html).toContain('Barcha kassalar');
    expect(html).toContain('132 ta faol');
    expect(html).toContain('18 ta');
  });

  it('renders SELECT scope confirmation modal specifying (barcha kassalari)', () => {
    const selectProps = {
      ...baseProps,
      targetScope: 'SELECT',
      targetType: 'STORES',
      selectedStoreIds: [10, 20],
      selectedStores: [
        { id: 10, name: 'Store 1', companyName: 'Comp A' },
        { id: 20, name: 'Store 2', companyName: 'Comp B' },
      ],
    };
    const html = renderToStaticMarkup(
      React.createElement(PlatformDesktopConfirmModal, { p: selectProps })
    );

    expect(html).toContain('2 ta (barcha kassalari)');
    expect(html).toContain('Store 1 (Comp A)');
    expect(html).toContain('Store 2 (Comp B)');
  });
});
