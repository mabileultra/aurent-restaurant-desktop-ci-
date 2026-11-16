import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('../../hooks/usePayFlowTransition', () => ({
  usePayFlowTransition: vi.fn(),
}));

import CashierRegisterShell from './CashierRegisterShell';

globalThis.React = React;

describe('CashierRegisterShell', () => {
  it('рендерит рабочую область и колонку оплаты без монтирования продуктового CashierBottomNav', () => {
    const MockPayColumn = () => React.createElement('aside', { className: 'mock-pay-col' }, 'pay');

    const html = renderToStaticMarkup(
      React.createElement(
        CashierRegisterShell,
        {
          pay: { payOpen: false, onPayFlowClosed: vi.fn() },
          PayColumn: MockPayColumn,
        },
        React.createElement('section', { className: 'pos-stage-content' }, 'items')
      )
    );

    expect(html).toContain('pos-stage-content');
    expect(html).toContain('mock-pay-col');
    expect(html).not.toContain('cashier-register__bottom-nav');
    expect(html).not.toContain('cashier-bottom-nav');
  });
});

