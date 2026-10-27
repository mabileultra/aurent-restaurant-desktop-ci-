import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import BillingPayModal from './BillingPayModal';

globalThis.React = React;

describe('BillingPayModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    t: (key) => key,
    money: (v) => `${v} sum`,
    amount: '850 000',
    setAmount: vi.fn(),
    amountValid: true,
    presets: [500000, 850000, 1500000],
    method: 'CLICK',
    setMethod: vi.fn(),
    paying: false,
    onPay: vi.fn(),
  };

  it('renders presets and marks active preset correctly with formatted amount', () => {
    const html = renderToStaticMarkup(React.createElement(BillingPayModal, defaultProps));
    expect(html).toContain('billing-preset--active');
    expect(html).toContain('850000 sum');
    expect(html).toContain('value="850 000"');
  });

  it('does not render when open is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(BillingPayModal, {
        ...defaultProps,
        open: false,
      })
    );
    expect(html).toBe('');
  });
});
