import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

globalThis.React = React;

vi.mock('../../../components/ui', () => ({
  PageLayout: ({ title, subtitle, children }) =>
    React.createElement(
      'div',
      { 'data-testid': 'page-layout' },
      React.createElement('h1', null, title),
      React.createElement('p', null, subtitle),
      children
    ),
}));

const mockBaseHook = {
  t: (key, fallback) => {
    if (typeof fallback === 'string') return fallback;
    if (fallback?.defaultValue) return fallback.defaultValue;
    if (key === 'platform.desktopNotifications.title') return 'Kassa xabarlari';
    if (key === 'platform.desktopNotifications.subtitle')
      return 'Desktop-kassalarga xabar, ilova yangilanishi va muhim ogohlantirish yuborish.';
    if (key === 'platform.desktopNotifications.broadcastTitle') return 'Yangi xabar';
    if (key === 'platform.desktopNotifications.stepTarget') return 'Kimga';
    if (key === 'platform.desktopNotifications.targetAll') return 'Barcha kassalar';
    if (key === 'platform.desktopNotifications.targetSelect') return 'Tanlab yuborish';
    if (key === 'platform.desktopNotifications.registersCount') return `${fallback?.count ?? 248} ta kassa`;
    if (key === 'platform.desktopNotifications.registersCountUnknown') return 'Noma\'lum (barcha faol kassalar)';
    if (key === 'platform.desktopNotifications.comingSoon') return 'Tez kunda';
    if (key === 'platform.desktopNotifications.stepContent') return 'Xabar matni';
    if (key === 'platform.desktopNotifications.badgeFilled') return 'To\'liq';
    if (key === 'platform.desktopNotifications.badgeEmpty') return 'Bo\'sh';
    if (key === 'platform.desktopNotifications.stepKind') return 'Turi';
    if (key === 'platform.desktopNotifications.kindAlert') return 'Muhim';
    if (key === 'platform.desktopNotifications.kindUpdate') return 'Yangilanish';
    if (key === 'platform.desktopNotifications.kindMessage') return 'Xabar';
    if (key === 'platform.desktopNotifications.stepSchedule') return 'Muddat va vaqt';
    if (key === 'platform.desktopNotifications.sendBtn') return `${fallback?.count ?? 248} ta kassaga yuborish`;
    if (key === 'platform.desktopNotifications.sendBtnAll') return 'Barcha kassalarga yuborish';
    if (key === 'platform.desktopNotifications.livePreviewTitle') return 'Kassada ko\'rinishi';
    if (key === 'platform.desktopNotifications.previewUz') return 'UZ ko\'rinishi';
    if (key === 'platform.desktopNotifications.previewRu') return 'RU ko\'rinishi';
    if (key === 'platform.desktopNotifications.previewDismissBtn') return fallback?.lng === 'ru' ? 'Понятно' : 'Tushunarli';
    if (key === 'platform.desktopNotifications.previewUpdateBtn') return 'Ilovani yangilash';
    if (key === 'platform.desktopNotifications.previewCloseBtn') return 'Yopish';
    if (key === 'platform.desktopNotifications.historyTitle') return 'Yuborilganlar';
    if (key === 'platform.desktopNotifications.colSent') return 'YUBORILGAN';
    if (key === 'platform.desktopNotifications.colKind') return 'TURI';
    if (key === 'platform.desktopNotifications.colMessage') return 'XABAR';
    if (key === 'platform.desktopNotifications.colTarget') return 'KIMGA';
    if (key === 'platform.desktopNotifications.colDelivered') return 'YETKAZILDI';
    if (key === 'platform.desktopNotifications.colRead') return 'O\'QILDI';
    if (key === 'platform.desktopNotifications.colStatus') return 'HOLAT';
    if (key === 'platform.desktopNotifications.untracked') return 'Kuzatilmagan';
    if (key === 'platform.desktopNotifications.detailUntrackedHint')
      return "Kassalarda hisoblagich kuzatilmagan (Server barcha faol kassalarga tarqatadi, alohida o'qish kvitansiyalari yuritilmaydi).";
    if (key === 'platform.desktopNotifications.confirmModalTitle') return `${fallback?.count ?? 248} ta kassaga yuborilsinmi?`;
    if (key === 'platform.desktopNotifications.confirmModalTitleAll') return 'Barcha kassalarga yuborilsinmi?';
    if (key === 'platform.desktopNotifications.confirmCancel') return 'Ortga, tahrirlash';
    if (key === 'platform.desktopNotifications.confirmSubmit') return `Ha, ${fallback?.count ?? 248} ta kassaga yuborish`;
    if (key === 'platform.desktopNotifications.confirmSubmitAll') return 'Ha, barcha kassalarga yuborish';
    if (key === 'platform.desktopNotifications.actionDuplicate') return 'Nusxa olib yangi xabar';
    if (key === 'platform.desktopNotifications.actionExtend') return 'Muddatni uzaytirish';
    if (key === 'platform.desktopNotifications.actionRevoke') return 'Kassalardan olib tashlash';
    return key;
  },
  i18n: { language: 'uz' },
  title: 'Ertaga 02:00–03:00 da texnik ishlar',
  setTitle: vi.fn(),
  body: 'Bu vaqtda kassa oflayn rejimda ishlaydi.',
  setBody: vi.fn(),
  titleUz: 'Ertaga 02:00–03:00 da texnik ishlar',
  setTitleUz: vi.fn(),
  bodyUz: 'Bu vaqtda kassa oflayn rejimda ishlaydi.',
  setBodyUz: vi.fn(),
  titleRu: '',
  setTitleRu: vi.fn(),
  bodyRu: '',
  setBodyRu: vi.fn(),
  langTab: 'uz',
  setLangTab: vi.fn(),
  previewLang: 'uz',
  setPreviewLang: vi.fn(),
  targetScope: 'ALL',
  setTargetScope: vi.fn(),
  kind: 'ALERT',
  setKind: vi.fn(),
  duration: '3d',
  setDuration: vi.fn(),
  expiresInHours: 72,
  visibleUntilFormatted: '1-noyabr, 14:30',
  scheduleType: 'NOW',
  setScheduleType: vi.fn(),
  needsConfirm: true,
  setNeedsConfirm: vi.fn(),
  totalRegistersCount: 248,
  draftSaved: true,
  isDraftRestored: false,
  handleDismissDraftNotice: vi.fn(),
  confirmModalOpen: false,
  setConfirmModalOpen: vi.fn(),
  selectedItemForDrawer: null,
  setSelectedItemForDrawer: vi.fn(),
  searchQuery: '',
  setSearchQuery: vi.fn(),
  statusFilter: 'ALL',
  setStatusFilter: vi.fn(),
  history: [
    {
      id: '1',
      createdAt: '2026-10-28T18:10:00Z',
      expiresAt: '2026-10-31T18:10:00Z',
      kind: 'ALERT',
      title: 'Ertaga 02:00–03:00 da texnik ishlar',
      body: 'Bu vaqtda kassa oflayn rejimda ishlaydi.',
      targetLabel: 'Barcha kassalar',
      status: 'ACTIVE',
    },
  ],
  totalHistoryCount: 1,
  historyLoading: false,
  handleSend: vi.fn(),
  handleClear: vi.fn(),
  handleDuplicate: vi.fn(),
  handleRevoke: vi.fn(),
  handleExtend: vi.fn(),
  executeBroadcast: vi.fn(),
  sendPending: false,
};

let currentHookState = { ...mockBaseHook };

vi.mock('../hooks/usePlatformDesktopNotificationsPage', () => ({
  usePlatformDesktopNotificationsPage: () => currentHookState,
}));

import PlatformDesktopNotificationsPage from './PlatformDesktopNotificationsPage';
import PlatformDesktopConfirmModal from '../components/desktop-notifications/PlatformDesktopConfirmModal';
import PlatformDesktopNotificationDetailDrawer from '../components/desktop-notifications/PlatformDesktopNotificationDetailDrawer';

describe('PlatformDesktopNotificationsPage', () => {
  it('renders complete page structure with form, live preview, and history table', () => {
    currentHookState = { ...mockBaseHook };
    const html = renderToStaticMarkup(React.createElement(PlatformDesktopNotificationsPage));

    // Page title and subtitle
    expect(html).toContain('Kassa xabarlari');
    expect(html).toContain('Desktop-kassalarga xabar, ilova yangilanishi va muhim ogohlantirish yuborish.');

    // Step 1: Kimga
    expect(html).toContain('Kimga');
    expect(html).toContain('248 ta kassa');
    expect(html).toContain('Barcha kassalar');
    expect(html).toContain('Tez kunda');

    // Step 2: Xabar matni
    expect(html).toContain('Xabar matni');

    // Step 3: Turi
    expect(html).toContain('Turi');
    expect(html).toContain('Muhim');
    expect(html).toContain('Yangilanish');
    expect(html).toContain('Xabar');

    // Step 4: Muddat va vaqt
    expect(html).toContain('Muddat va vaqt');

    // Live preview monitor
    expect(html).toContain('Kassada ko&#x27;rinishi');
    expect(html).toContain('Aurent Kassa');

    // Bottom history table
    expect(html).toContain('Yuborilganlar');
    expect(html).toContain('YUBORILGAN');
    expect(html).toContain('TURI');
    expect(html).toContain('XABAR');
    expect(html).toContain('YETKAZILDI');
    expect(html).toContain('O&#x27;QILDI');
    expect(html).toContain('HOLAT');
  });

  it('renders confirmation modal with summary details and submit button', () => {
    const confirmProps = {
      ...mockBaseHook,
      confirmModalOpen: true,
    };
    const html = renderToStaticMarkup(
      React.createElement(PlatformDesktopConfirmModal, { p: confirmProps })
    );

    expect(html).toContain('248 ta kassaga yuborilsinmi?');
    expect(html).toContain('Ortga, tahrirlash');
    expect(html).toContain('Ha, 248 ta kassaga yuborish');
    expect(html).toContain('Ertaga 02:00–03:00 da texnik ishlar');
  });

  it('handles unknown total registers count gracefully in confirmation modal', () => {
    const confirmProps = {
      ...mockBaseHook,
      confirmModalOpen: true,
      totalRegistersCount: null,
    };
    const html = renderToStaticMarkup(
      React.createElement(PlatformDesktopConfirmModal, { p: confirmProps })
    );

    expect(html).toContain('Barcha kassalarga yuborilsinmi?');
    expect(html).toContain('Ha, barcha kassalarga yuborish');
    expect(html).toContain('Noma&#x27;lum');
  });

  it('renders slide-over detail drawer with honest untracked status', () => {
    const drawerProps = {
      ...mockBaseHook,
      selectedItemForDrawer: mockBaseHook.history[0],
    };
    const html = renderToStaticMarkup(
      React.createElement(PlatformDesktopNotificationDetailDrawer, { p: drawerProps })
    );

    expect(html).toContain('Ertaga 02:00–03:00 da texnik ishlar');
    expect(html).toContain('Kuzatilmagan');
    expect(html).toContain('Kassalarda hisoblagich kuzatilmagan');
    expect(html).toContain('Nusxa olib yangi xabar');
    expect(html).toContain('Muddatni uzaytirish');
    expect(html).toContain('Kassalardan olib tashlash');
  });

  it('renders draft restored notice banner when isDraftRestored is true', () => {
    currentHookState = {
      ...mockBaseHook,
      isDraftRestored: true,
    };
    const html = renderToStaticMarkup(React.createElement(PlatformDesktopNotificationsPage));

    expect(html).toContain('Qoralama tiklandi');
  });
});
