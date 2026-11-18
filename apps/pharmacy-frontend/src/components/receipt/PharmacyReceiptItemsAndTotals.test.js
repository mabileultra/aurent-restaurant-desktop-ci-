import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PharmacyReceiptItemsAndTotals from './PharmacyReceiptItemsAndTotals.jsx';

describe('PharmacyReceiptItemsAndTotals (AUR-7 committent)', () => {
  const t = (key, def) => {
    const dict = {
      'receipt.ikpuLine': 'IKPU',
      'receipt.committentTin': 'Komitent (STIR)',
      'receipt.committentPinfl': 'Komitent (JShShIR)',
    };
    return dict[key] || def || key;
  };

  const isOn = (k) => k === 'items' || k === 'itemIkpu';

  it('renders committent TIN under item when valid 9 digits present', () => {
    const sale = {
      items: [
        {
          productName: 'Amoksitsillin 500mg',
          quantity: 2,
          unitPrice: 15000,
          lineTotal: 30000,
          ikpu: '00101001001000000',
          commissionTin: '200523221',
        },
      ],
    };

    const html = renderToStaticMarkup(
      React.createElement(PharmacyReceiptItemsAndTotals, {
        sale,
        isOn,
        vatRateLabel: '12',
        t,
      }),
    );
    expect(html).toContain('Amoksitsillin 500mg');
    expect(html).toContain('00101001001000000');
    expect(html).toContain('Komitent (STIR): 200523221');
  });

  it('renders committent PINFL under item when valid 14 digits present', () => {
    const sale = {
      items: [
        {
          productName: 'Shaxsiy dori',
          quantity: 1,
          unitPrice: 20000,
          lineTotal: 20000,
          commissionPinfl: '12345678901234',
        },
      ],
    };

    const html = renderToStaticMarkup(
      React.createElement(PharmacyReceiptItemsAndTotals, {
        sale,
        isOn,
        vatRateLabel: '12',
        t,
      }),
    );
    expect(html).toContain('Komitent (JShShIR): 12345678901234');
  });

  it('omits committent row when missing or invalid', () => {
    const sale = {
      items: [
        {
          productName: 'Oddiy dori',
          quantity: 1,
          unitPrice: 10000,
          lineTotal: 10000,
          commissionTin: null,
        },
      ],
    };

    const html = renderToStaticMarkup(
      React.createElement(PharmacyReceiptItemsAndTotals, {
        sale,
        isOn,
        vatRateLabel: '12',
        t,
      }),
    );
    expect(html).toContain('Oddiy dori');
    expect(html).not.toContain('Komitent');
  });
});
