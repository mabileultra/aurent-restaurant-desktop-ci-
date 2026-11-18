import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import ReceiptItemsSection from './ReceiptItemsSection.jsx';

describe('ReceiptItemsSection (AUR-7 committent)', () => {
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
          productName: 'Komitent tovari',
          quantity: 1,
          unitPrice: 10000,
          lineTotal: 10000,
          ikpu: '00101001001000000',
          commissionTin: '200523221',
        },
      ],
    };

    const html = renderToString(<ReceiptItemsSection sale={sale} isOn={isOn} t={t} />);
    expect(html).toContain('Komitent tovari');
    expect(html).toContain('00101001001000000');
    expect(html).toContain('Komitent (STIR): 200523221');
  });

  it('renders committent PINFL under item when valid 14 digits present', () => {
    const sale = {
      items: [
        {
          productName: 'Jismoniy shaxs tovari',
          quantity: 1,
          unitPrice: 50000,
          lineTotal: 50000,
          commissionPinfl: '12345678901234',
        },
      ],
    };

    const html = renderToString(<ReceiptItemsSection sale={sale} isOn={isOn} t={t} />);
    expect(html).toContain('Komitent (JShShIR): 12345678901234');
  });

  it('omits committent row when missing or invalid', () => {
    const sale = {
      items: [
        {
          productName: 'Oddiy tovar',
          quantity: 2,
          unitPrice: 15000,
          lineTotal: 30000,
          commissionTin: 'bad_tin',
        },
      ],
    };

    const html = renderToString(<ReceiptItemsSection sale={sale} isOn={isOn} t={t} />);
    expect(html).toContain('Oddiy tovar');
    expect(html).not.toContain('Komitent');
  });
});
