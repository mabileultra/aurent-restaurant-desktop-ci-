import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RoleEmployeeDiscardConfirmDialog from './RoleEmployeeDiscardConfirmDialog';

describe('RoleEmployeeDiscardConfirmDialog', () => {
  it('renders null when isOpen is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(RoleEmployeeDiscardConfirmDialog, {
        isOpen: false,
        onStay: vi.fn(),
        onDiscard: vi.fn(),
      })
    );
    expect(html).toBe('');
  });

  it('renders accessible dialog with role="dialog", aria-modal="true", and title when open', () => {
    const html = renderToStaticMarkup(
      React.createElement(RoleEmployeeDiscardConfirmDialog, {
        isOpen: true,
        onStay: vi.fn(),
        onDiscard: vi.fn(),
      })
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-labelledby="discard-confirm-title"');
    expect(html).toContain('Saqlanmagan o‘zgarishlar mavjud');
    expect(html).toContain('Qolish');
    expect(html).toContain('O‘zgarishlarni bekor qilish');
  });
});
