import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import BaseModal from './BaseModal';

globalThis.React = React;

describe('BaseModal', () => {
  it('returns null when open is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(BaseModal, { open: false, title: 'Test Modal' }, 'Body content')
    );
    expect(html).toBe('');
  });

  it('renders modal dialog with dark mode classes and accessibility attributes', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        BaseModal,
        {
          open: true,
          title: 'To‘lov qo‘shish',
          onClose: vi.fn(),
          footer: React.createElement('button', null, 'Saqlash'),
        },
        React.createElement('p', null, 'Form content')
      )
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-labelledby="base-modal-title"');
    expect(html).toContain('dark:!bg-slate-900');
    expect(html).toContain('dark:!border-slate-800');
    expect(html).toContain('dark:text-slate-100');
    expect(html).toContain('To‘lov qo‘shish');
    expect(html).toContain('Form content');
    expect(html).toContain('Saqlash');
  });

  it('renders close button with dark hover styling', () => {
    const html = renderToStaticMarkup(
      React.createElement(BaseModal, {
        open: true,
        title: 'Title',
        onClose: vi.fn(),
      })
    );

    expect(html).toContain('aria-label="Close"');
    expect(html).toContain('dark:text-slate-400');
    expect(html).toContain('dark:hover:!bg-slate-800');
  });
});
