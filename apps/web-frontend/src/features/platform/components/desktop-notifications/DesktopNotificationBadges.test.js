import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { NotificationKindBadge, NotificationStatusBadge } from './DesktopNotificationBadges';

const mockT = (key) => {
  const map = {
    'platform.desktopNotifications.kindAlert': 'Muhim',
    'platform.desktopNotifications.kindUpdate': 'Yangilanish',
    'platform.desktopNotifications.kindMessage': 'Xabar',
    'platform.desktopNotifications.statusActive': 'Faol',
    'platform.desktopNotifications.statusScheduled': 'Rejalashtirilgan',
    'platform.desktopNotifications.statusExpired': 'Muddati tugagan',
  };
  return map[key] || key;
};

describe('DesktopNotificationBadges', () => {
  it('renders correct kind badges', () => {
    const alertHtml = renderToStaticMarkup(React.createElement(NotificationKindBadge, { kind: 'ALERT', t: mockT }));
    expect(alertHtml).toContain('Muhim');
    expect(alertHtml).toContain('bg-rose-50');

    const updateHtml = renderToStaticMarkup(React.createElement(NotificationKindBadge, { kind: 'UPDATE', t: mockT }));
    expect(updateHtml).toContain('Yangilanish');
    expect(updateHtml).toContain('bg-blue-50');

    const messageHtml = renderToStaticMarkup(React.createElement(NotificationKindBadge, { kind: 'MESSAGE', t: mockT }));
    expect(messageHtml).toContain('Xabar');
    expect(messageHtml).toContain('bg-emerald-50');
  });

  it('renders correct status badges', () => {
    const activeHtml = renderToStaticMarkup(React.createElement(NotificationStatusBadge, { status: 'ACTIVE', t: mockT }));
    expect(activeHtml).toContain('Faol');
    expect(activeHtml).toContain('bg-emerald-500');

    const scheduledHtml = renderToStaticMarkup(React.createElement(NotificationStatusBadge, { status: 'SCHEDULED', t: mockT }));
    expect(scheduledHtml).toContain('Rejalashtirilgan');
    expect(scheduledHtml).toContain('bg-blue-500');

    const expiredHtml = renderToStaticMarkup(React.createElement(NotificationStatusBadge, { status: 'EXPIRED', t: mockT }));
    expect(expiredHtml).toContain('Muddati tugagan');
    expect(expiredHtml).toContain('bg-slate-400');
  });
});
