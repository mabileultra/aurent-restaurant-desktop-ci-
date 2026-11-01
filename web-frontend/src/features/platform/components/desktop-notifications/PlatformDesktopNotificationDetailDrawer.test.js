import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformDesktopNotificationDetailDrawer from './PlatformDesktopNotificationDetailDrawer';

globalThis.React = React;

describe('PlatformDesktopNotificationDetailDrawer', () => {
  const mockItem = {
    id: 'test-notif-1',
    title: 'Yangilik',
    body: 'Tizim yangilandi',
    kind: 'INFO',
    status: 'ACTIVE',
    createdAt: '2026-11-01T10:00:00.000Z',
    expiresAt: '2026-11-02T10:00:00.000Z',
  };

  const defaultProps = {
    p: {
      selectedItemForDrawer: mockItem,
      setSelectedItemForDrawer: vi.fn(),
      handleDuplicate: vi.fn(),
      handleExtend: vi.fn(),
      handleRevokePrompt: vi.fn(),
      revokeConfirmItem: null,
      t: (key, opts) => opts?.defaultValue || key,
      i18n: { language: 'uz' },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders null when selectedItemForDrawer is null', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformDesktopNotificationDetailDrawer, {
        p: { ...defaultProps.p, selectedItemForDrawer: null },
      })
    );

    expect(html).toBe('');
  });

  it('renders drawer dialog with notification content when open', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformDesktopNotificationDetailDrawer, defaultProps)
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('Yangilik');
    expect(html).toContain('Tizim yangilandi');
  });
});
