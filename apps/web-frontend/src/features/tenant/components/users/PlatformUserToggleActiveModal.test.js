import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformUserToggleActiveModal from './PlatformUserToggleActiveModal';

globalThis.React = React;

describe('PlatformUserToggleActiveModal', () => {
  const mockT = (key, opts) => {
    if (typeof opts?.defaultValue === 'string') return opts.defaultValue;
    return key;
  };

  it('renders nothing when user is null', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformUserToggleActiveModal, {
        user: null,
        currentUserId: 1,
        currentUsername: 'superadmin',
        t: mockT,
        isPending: false,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
      })
    );
    expect(html).toBe('');
  });

  it('renders deactivation warning and disabled confirm for self', () => {
    const user = { id: 1, username: 'superadmin', fullName: 'Super Admin', active: true };
    const html = renderToStaticMarkup(
      React.createElement(PlatformUserToggleActiveModal, {
        user,
        currentUserId: 1,
        currentUsername: 'superadmin',
        t: mockT,
        isPending: false,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
      })
    );

    expect(html).toContain('O‘z hisobingizni faolsizlantira olmaysiz');
    expect(html).toContain('disabled');
  });

  it('renders deactivation confirmation for other active user', () => {
    const user = { id: 2, username: 'cashier1', fullName: 'Ali Valiyev', active: true };
    const html = renderToStaticMarkup(
      React.createElement(PlatformUserToggleActiveModal, {
        user,
        currentUserId: 1,
        currentUsername: 'superadmin',
        t: mockT,
        isPending: false,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
      })
    );

    expect(html).toContain('Foydalanuvchini faolsizlantirish');
    expect(html).toContain('Ali Valiyev');
    expect(html).toContain('Faolsizlantirish');
  });

  it('renders activation confirmation for inactive user', () => {
    const user = { id: 3, username: 'inactive_user', fullName: 'Vali Aliyev', active: false };
    const html = renderToStaticMarkup(
      React.createElement(PlatformUserToggleActiveModal, {
        user,
        currentUserId: 1,
        currentUsername: 'superadmin',
        t: mockT,
        isPending: false,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
      })
    );

    expect(html).toContain('Foydalanuvchini faollashtirish');
    expect(html).toContain('Vali Aliyev');
    expect(html).toContain('Faollashtirish');
  });
});
