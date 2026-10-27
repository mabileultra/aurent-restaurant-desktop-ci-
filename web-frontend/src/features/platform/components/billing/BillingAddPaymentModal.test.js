import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import BillingAddPaymentModal from './BillingAddPaymentModal';

globalThis.React = React;

describe('BillingAddPaymentModal', () => {
  const defaultProps = {
    t: (key) => key,
    companies: [
      {
        billing: {
          companyId: 101,
          companyName: 'Test Company',
        },
      },
    ],
    initialCompanyId: null,
    busy: false,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
  };

  it('renders successfully without crashing', () => {
    const html = renderToStaticMarkup(React.createElement(BillingAddPaymentModal, defaultProps));

    expect(html).toContain('platform.billing.collections.addPaymentTitle');
    expect(html).toContain('Test Company');
    expect(html).toContain('platform.billing.collections.savePayment');
  });

  it('renders safely when companies is undefined or null', () => {
    const html = renderToStaticMarkup(
      React.createElement(BillingAddPaymentModal, {
        ...defaultProps,
        companies: undefined,
      })
    );

    expect(html).toContain('platform.billing.collections.addPaymentTitle');
  });

  it('handles object initialCompanyId gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(BillingAddPaymentModal, {
        ...defaultProps,
        initialCompanyId: { companyId: 202 },
      })
    );

    expect(html).not.toContain('[object Object]');
  });
});
