import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformDesktopRowMenu from './PlatformDesktopRowMenu';

globalThis.React = React;

describe('PlatformDesktopRowMenu', () => {
  const mockItem = {
    id: 'test-item-1',
    title: 'Test Notification',
    body: 'Test content',
  };

  const defaultProps = {
    item: mockItem,
    isOpen: false,
    onToggle: vi.fn(),
    onClose: vi.fn(),
    onViewDetails: vi.fn(),
    onDuplicate: vi.fn(),
    t: (key, opts) => opts?.defaultValue || key,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders closed trigger button with proper accessible attributes', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformDesktopRowMenu, defaultProps)
    );

    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('role="menu"');
  });

  it('renders portal menu with actions when isOpen is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformDesktopRowMenu, {
        ...defaultProps,
        isOpen: true,
      })
    );

    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('role="menu"');
    expect(html).toContain('role="menuitem"');
    expect(html).toContain('platform.desktopNotifications.drawerTitle');
    expect(html).toContain('platform.desktopNotifications.actionDuplicate');
    expect(html).toContain('platform.desktopNotifications.actionRevoke');
    expect(html).toContain('Tez kunda');
    expect(html).toContain('disabled=""');
  });
});
