import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import FiscalReceiptItemsBlock from '../../src/components/receipt/FiscalReceiptItemsBlock.jsx';

describe('FiscalReceiptItemsBlock (AUR-7 committent)', () => {
  const t = (key, def) => {
    const dict = {
      'receipt.ikpuLine': 'IKPU',
      'receipt.committentTin': 'Komitent (STIR)',
      'receipt.committentPinfl': 'Komitent (JShShIR)',
    };
    return dict[key] || def || key;
  };

  const isOn = (k) => k === 'items' || k === 'itemIkpu';
  const fs = (_sectionKey, className) => ({ className });

  it('renders committent TIN under dish when present', () => {
    const items = [
      {
        productName: 'Shashlik (komitent)',
        quantity: 3,
        unitPrice: 20000,
        lineTotal: 60000,
        ikpu: '00101001001000000',
        commissionTin: '200523221',
      },
    ];

    const html = renderToStaticMarkup(
      React.createElement(FiscalReceiptItemsBlock, {
        items,
        isOn,
        fs,
        t,
      }),
    );
    expect(html).toContain('Shashlik (komitent)');
    expect(html).toContain('00101001001000000');
    expect(html).toContain('Komitent (STIR): 200523221');
  });

  it('renders committent PINFL under dish when present', () => {
    const items = [
      {
        productName: 'Maxsus pishiriq (JShShIR)',
        quantity: 1,
        unitPrice: 30000,
        lineTotal: 30000,
        commissionPinfl: '12345678901234',
      },
    ];

    const html = renderToStaticMarkup(
      React.createElement(FiscalReceiptItemsBlock, {
        items,
        isOn,
        fs,
        t,
      }),
    );
    expect(html).toContain('Komitent (JShShIR): 12345678901234');
  });

  it('omits committent row for standard dishes without committent', () => {
    const items = [
      {
        productName: 'Palov (oddiy taom)',
        quantity: 1,
        unitPrice: 35000,
        lineTotal: 35000,
      },
    ];

    const html = renderToStaticMarkup(
      React.createElement(FiscalReceiptItemsBlock, {
        items,
        isOn,
        fs,
        t,
      }),
    );
    expect(html).toContain('Palov (oddiy taom)');
    expect(html).not.toContain('Komitent');
  });
});
