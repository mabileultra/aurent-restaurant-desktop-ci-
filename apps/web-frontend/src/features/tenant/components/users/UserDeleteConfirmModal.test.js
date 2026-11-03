import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import UserDeleteConfirmModal from './UserDeleteConfirmModal';

globalThis.React = React;

describe('UserDeleteConfirmModal', () => {
  const t = (k, opts) => {
    if (k === 'users.deleteHint') return `Haqiqatan ham ${opts?.name} ni o'chirmoqchimisiz?`;
    if (k === 'users.deleteTitle') return "Foydalanuvchini o'chirish";
    if (k === 'common.cancel') return 'Bekor qilish';
    if (k === 'common.delete') return "O'chirish";
    return k;
  };

  it('renders nothing when user is null', () => {
    const html = renderToStaticMarkup(
      React.createElement(UserDeleteConfirmModal, {
        user: null,
        t,
        isPending: false,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
      })
    );
    expect(html).toBe('');
  });

  it('renders accessible dialog with sanitized user name and action buttons', () => {
    const user = { id: 10, fullName: '— TEST Claude Sinov', username: 'claude_test' };
    const html = renderToStaticMarkup(
      React.createElement(UserDeleteConfirmModal, {
        user,
        t,
        isPending: false,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
      })
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('TEST Claude Sinov');
    expect(html).toContain("Foydalanuvchini o&#x27;chirish");
    expect(html).toContain('Bekor qilish');
  });
});
