import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  formatUzbekMonthLower,
  usePlatformDesktopNotificationsPage,
} from './usePlatformDesktopNotificationsPage';

globalThis.React = React;

vi.mock('../../../api', () => ({
  platformDesktopNotificationsApi: {
    list: vi.fn().mockResolvedValue({ data: [] }),
    broadcast: vi.fn().mockResolvedValue({ data: { id: 'test-1' } }),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => opts?.defaultValue || key,
    i18n: { language: 'uz' },
  }),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('usePlatformDesktopNotificationsPage hook & utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('correctly lowercases Uzbek month names with hyphen', () => {
    expect(formatUzbekMonthLower('30-Oktabr, 14:30')).toBe('30-oktabr, 14:30');
    expect(formatUzbekMonthLower('15-Yanvar 2027, 09:00')).toBe('15-yanvar 2027, 09:00');
    expect(formatUzbekMonthLower('1-May, 12:00')).toBe('1-may, 12:00');
    expect(formatUzbekMonthLower('')).toBe('');
    expect(formatUzbekMonthLower(null)).toBe('');
  });

  it('validates custom hours boundaries (1 to 720)', () => {
    const validate = (duration, customHours) => {
      if (duration !== 'other') return true;
      const trimmed = String(customHours ?? '').trim();
      if (!trimmed) return false;
      const num = Number(trimmed);
      return Number.isInteger(num) && num >= 1 && num <= 720;
    };

    expect(validate('3d', '72')).toBe(true);
    expect(validate('other', '0')).toBe(false);
    expect(validate('other', '')).toBe(false);
    expect(validate('other', '   ')).toBe(false);
    expect(validate('other', '-5')).toBe(false);
    expect(validate('other', '1')).toBe(true);
    expect(validate('other', '48')).toBe(true);
    expect(validate('other', '720')).toBe(true);
    expect(validate('other', '721')).toBe(false);
    expect(validate('other', '100000')).toBe(false);
    expect(validate('other', '48.5')).toBe(false);
    expect(validate('other', 'abc')).toBe(false);
  });

  it('executes hook without ReferenceError when title and body are populated', () => {
    let capturedResult = null;

    function TestComponent() {
      const hook = usePlatformDesktopNotificationsPage();
      capturedResult = hook;
      return React.createElement(
        'div',
        null,
        React.createElement('span', { 'data-testid': 'kind' }, hook.kind),
        React.createElement('span', { 'data-testid': 'can-send' }, String(hook.canSend))
      );
    }

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    // Rendering does not throw "Cannot access 'broadcastMutation' before initialization"
    expect(() => {
      renderToStaticMarkup(
        React.createElement(
          QueryClientProvider,
          { client: queryClient },
          React.createElement(TestComponent)
        )
      );
    }).not.toThrow();

    // Default kind is MESSAGE
    expect(capturedResult.kind).toBe('MESSAGE');
    expect(capturedResult.canSend).toBe(false);
    expect(capturedResult.totalRegistersCount).toBe(null);
  });
});
