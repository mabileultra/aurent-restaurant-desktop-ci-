import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { useDesktopNotificationTiming } from './useDesktopNotificationTiming';

globalThis.React = React;

describe('useDesktopNotificationTiming', () => {
  it('handles NOW schedule type by default', () => {
    let result = null;
    function Consumer() {
      result = useDesktopNotificationTiming({ duration: '1d', customHours: '24', scheduleType: 'NOW' });
      return React.createElement('div', null, result.expiresInHours);
    }
    renderToStaticMarkup(React.createElement(Consumer));

    expect(result.expiresInHours).toBe(24);
    expect(result.isCustomHoursValid).toBe(true);
    expect(result.isScheduleValid).toBe(true);
    expect(result.scheduledAtIso).toBeNull();
  });

  it('validates future date for SCHEDULED schedule type', () => {
    let result = null;
    function Consumer() {
      // Future date in year 2099
      result = useDesktopNotificationTiming({
        duration: '3d',
        customHours: '72',
        scheduleType: 'SCHEDULED',
        scheduleDate: '2099-12-31',
        scheduleTime: '15:30',
      });
      return React.createElement('div', null, result.expiresInHours);
    }
    renderToStaticMarkup(React.createElement(Consumer));

    expect(result.isScheduleValid).toBe(true);
    expect(result.isScheduleInFuture).toBe(true);
    expect(result.scheduledAtIso).toContain('2099-12-31');
  });

  it('invalidates past date for SCHEDULED schedule type', () => {
    let result = null;
    function Consumer() {
      // Past date
      result = useDesktopNotificationTiming({
        duration: '3d',
        customHours: '72',
        scheduleType: 'SCHEDULED',
        scheduleDate: '2020-01-01',
        scheduleTime: '12:00',
      });
      return React.createElement('div', null, result.expiresInHours);
    }
    renderToStaticMarkup(React.createElement(Consumer));

    expect(result.isScheduleValid).toBe(false);
    expect(result.isScheduleInFuture).toBe(false);
    expect(result.scheduledAtIso).toBeNull();
  });
});
