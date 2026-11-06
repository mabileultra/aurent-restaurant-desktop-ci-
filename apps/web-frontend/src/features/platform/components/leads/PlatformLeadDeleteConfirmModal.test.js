import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformLeadDeleteConfirmModal from './PlatformLeadDeleteConfirmModal';

describe('PlatformLeadDeleteConfirmModal', () => {
  it('returns null when isOpen is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformLeadDeleteConfirmModal, {
        isOpen: false,
        leadName: 'Nodira Market',
        onClose: vi.fn(),
        onConfirm: vi.fn(),
        isDeleting: false,
      })
    );
    expect(html).toBe('');
  });

  it('renders modal content correctly when isOpen is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformLeadDeleteConfirmModal, {
        isOpen: true,
        leadName: 'Nodira Market',
        onClose: vi.fn(),
        onConfirm: vi.fn(),
        isDeleting: false,
      })
    );
    expect(html).toContain('Arizani o&#x27;chirish');
    expect(html).toContain('Nodira Market');
    expect(html).toContain('Bekor qilish');
    expect(html).toContain('Ha, o&#x27;chirilsin');
  });

  it('renders deleting state button correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformLeadDeleteConfirmModal, {
        isOpen: true,
        leadName: 'Test Market',
        onClose: vi.fn(),
        onConfirm: vi.fn(),
        isDeleting: true,
      })
    );
    expect(html).toContain('O&#x27;chirilmoqda…');
  });
});
