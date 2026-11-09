import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { KorxonaReceiptRow } from './KorxonaReceiptRow';

describe('KorxonaReceiptRow', () => {
  const mockReceipt = [
    'RCP-20261028-0220', // 0: no
    '2026-10-28',        // 1: date
    '15:12',             // 2: time
    'Makon Mobile',      // 3: store
    'Kassir',            // 4: cashier
    1200000,             // 5: total
    'CASH',              // 6: payment
    true,                // 7: isFiscal
    'UZ190912014310',    // 8: fiscalModule
    '042449557347',      // 9: fiscalSign
    [['Tovar', 2, 600000]], // 10: items
    'sale-uuid-1',       // 11: saleId
  ];

  it('renders receipt row with fiscal status QR bilan and formatted total', () => {
    const html = renderToStaticMarkup(
      React.createElement(KorxonaReceiptRow, {
        receipt: mockReceipt,
        isSelected: false,
        onSelect: vi.fn(),
      })
    );

    expect(html).toContain('RCP-20261028-0220');
    expect(html).toContain('15:12');
    expect(html).toContain('Naqd');
    expect(html).toContain('2 dona');
    expect(html).toContain('1 200 000');
    expect(html).toContain('QR bilan');
  });

  it('highlights row when isSelected is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(KorxonaReceiptRow, {
        receipt: mockReceipt,
        isSelected: true,
        onSelect: vi.fn(),
      })
    );

    expect(html).toContain('border-l-[#2563EB]');
  });
});
