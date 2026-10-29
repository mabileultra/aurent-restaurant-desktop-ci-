import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('react-dom', () => ({
  createPortal: (node) => node,
}));

import TableRowActionsMenu from './TableRowActionsMenu';

globalThis.React = React;

describe('TableRowActionsMenu', () => {
  it('renders disabled action with disabled attribute and title tooltip', () => {
    const actions = [
      { label: 'Tahrirlash', onClick: vi.fn() },
      {
        label: 'O‘chirish',
        onClick: vi.fn(),
        danger: true,
        disabled: true,
        disabledReason: 'Ushbu rolni o‘chirish huquqi mavjud emas',
      },
    ];

    const html = renderToStaticMarkup(
      React.createElement(TableRowActionsMenu, {
        open: true,
        onOpenChange: vi.fn(),
        actions,
      })
    );

    // Verify disabled attribute and title tooltip are rendered
    expect(html).toContain('disabled=""');
    expect(html).toContain('title="Ushbu rolni o‘chirish huquqi mavjud emas"');
    expect(html).toContain('O‘chirish');
    expect(html).toContain('cursor-not-allowed opacity-40');
  });

  it('renders enabled action without disabled attribute', () => {
    const actions = [
      { label: 'Tahrirlash', onClick: vi.fn(), disabled: false },
    ];

    const html = renderToStaticMarkup(
      React.createElement(TableRowActionsMenu, {
        open: true,
        onOpenChange: vi.fn(),
        actions,
      })
    );

    expect(html).not.toContain('disabled=""');
    expect(html).toContain('Tahrirlash');
  });
});
