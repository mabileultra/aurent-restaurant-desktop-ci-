import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformEmailConfirmModal from './PlatformEmailConfirmModal';

globalThis.React = React;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
  }),
}));

describe('PlatformEmailConfirmModal', () => {
  it('does not render when isOpen is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformEmailConfirmModal, {
        isOpen: false,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
        recipientCount: 15,
        audienceLabel: 'Administrator, Kassir',
        subject: 'Texnik ishlar',
        isSending: false,
      })
    );
    expect(html).toBe('');
  });

  it('renders recipient count, audience label, and subject when open', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformEmailConfirmModal, {
        isOpen: true,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
        recipientCount: 42,
        audienceLabel: 'Barcha faol',
        subject: 'Kassa yangilanishi',
        isSending: false,
      })
    );

    expect(html).toContain('Xat yuborishni tasdiqlash');
    expect(html).toContain('42 ta qabul qiluvchi');
    expect(html).toContain('Barcha faol');
    expect(html).toContain('Kassa yangilanishi');
    expect(html).toContain('Tasdiqlash va yuborish');
  });

  it('shows loading state when isSending is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformEmailConfirmModal, {
        isOpen: true,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
        recipientCount: 10,
        audienceLabel: 'Rol bo‘yicha',
        subject: 'Mavzu',
        isSending: true,
      })
    );

    expect(html).toContain('Yuborilmoqda...');
  });
});
