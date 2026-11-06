import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformDesktopTimeSchedulePicker from './PlatformDesktopTimeSchedulePicker';

globalThis.React = React;

describe('PlatformDesktopTimeSchedulePicker', () => {
  const mockProps = {
    t: (key, fallback) => {
      if (typeof fallback === 'string') return fallback;
      if (fallback?.defaultValue) return fallback.defaultValue;
      if (key === 'platform.desktopNotifications.sendTime') return 'Yuborish vaqti';
      if (key === 'platform.desktopNotifications.sendNow') return 'Hozir';
      if (key === 'platform.desktopNotifications.sendSchedule') return 'Rejalashtirish';
      if (key === 'platform.desktopNotifications.sendNowNote') return 'Xabar saqlangandan so‘ng darhol kassalarga yetkaziladi';
      return key;
    },
    scheduleType: 'NOW',
    setScheduleType: vi.fn(),
    scheduleDate: '2026-11-01',
    setScheduleDate: vi.fn(),
    scheduleTime: '09:00',
    setScheduleTime: vi.fn(),
    isScheduleInFuture: true,
  };

  it('renders NOW mode with enabled sendSchedule button without Tez kunda badge', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformDesktopTimeSchedulePicker, { p: mockProps })
    );

    expect(html).toContain('Hozir');
    expect(html).toContain('Rejalashtirish');
    expect(html).not.toContain('Tez kunda');
    expect(html).not.toContain('disabled');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('Xabar saqlangandan');
  });

  it('renders SCHEDULED mode with date and time pickers', () => {
    const scheduledProps = { ...mockProps, scheduleType: 'SCHEDULED' };
    const html = renderToStaticMarkup(
      React.createElement(PlatformDesktopTimeSchedulePicker, { p: scheduledProps })
    );

    expect(html).toContain('Hozir');
    expect(html).toContain('Rejalashtirish');
    expect(html).not.toContain('Xabar saqlangandan');
  });

  it('sets aria-pressed true on sendSchedule button in SCHEDULED mode without Tez kunda badge', () => {
    const scheduledProps = { ...mockProps, scheduleType: 'SCHEDULED' };
    const html = renderToStaticMarkup(
      React.createElement(PlatformDesktopTimeSchedulePicker, { p: scheduledProps })
    );

    expect(html).not.toContain('disabled');
    expect(html).not.toContain('Tez kunda');
    expect(html).toContain('aria-pressed="true"');
  });
});
