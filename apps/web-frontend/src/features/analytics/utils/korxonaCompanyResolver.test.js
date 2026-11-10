import { describe, it, expect } from 'vitest';
import {
  resolveCompanyInfo,
  resolveCompanyCards,
  resolveCompanyDonuts,
  resolveCompanyProducts,
  resolveCompanyReceipts,
} from './korxonaCompanyResolver';

describe('korxonaCompanyResolver', () => {
  it('resolves Makon Mobile when id is 103 without apiDetail', () => {
    const info = resolveCompanyInfo({ numId: 103, apiDetail: null });
    expect(info.id).toBe(103);
    expect(info.name).toBe('Makon Mobile');
    expect(info.tin).toBe('309121333');
  });

  it('resolves Aminjon Samarqand XK when id is 29 from mock companies', () => {
    const info = resolveCompanyInfo({ numId: 29, apiDetail: null });
    expect(info.id).toBe(29);
    expect(info.name).toBe('Aminjon Samarqand XK');
    expect(info.tin).toBe('300575194');
    expect(info.monogram).toBe('AS');
  });

  it('resolves company from apiDetail when available', () => {
    const apiDetail = {
      name: 'Real API Corp',
      tin: '987654321',
      legalName: 'Real API Corp LLC',
      connected: true,
      businessTypeName: 'Oziq-ovqat',
    };
    const info = resolveCompanyInfo({ numId: 50, apiDetail });
    expect(info.name).toBe('Real API Corp');
    expect(info.tin).toBe('987654321');
    expect(info.monogram).toBe('RA');
    expect(info.isConnected).toBe(true);
  });

  it('maps GROCERY businessType and receipt KPIs from apiDetail', () => {
    const apiDetail = {
      name: 'Grocery Corp',
      tin: '111',
      businessType: 'GROCERY',
      averageCheck: 250000,
      fiscalReceiptCount: 40,
      nonFiscalReceiptCount: 10,
    };
    const info = resolveCompanyInfo({ numId: 77, apiDetail });
    expect(info.businessType).toBe('Oziq-ovqat');
    expect(info.avgCheck).toBe(250000);
    expect(info.totalChecks30d).toBe(50);
  });

  it('shows receipt counts on donut hints when apiDetail provides them', () => {
    const donuts = resolveCompanyDonuts({
      numId: 29,
      turnover: 100000000,
      fiscalTurnover: 98000000,
      nonFiscalTurnover: 2000000,
      apiDetail: { fiscalReceiptCount: 41, nonFiscalReceiptCount: 2 },
    });
    expect(donuts[0].hint).toContain('41 ta chek');
    expect(donuts[1].hint).toContain('2 ta chek');
  });

  it('builds dynamic cards for non-103 companies', () => {
    const cards = resolveCompanyCards({ numId: 29, turnover: 479088600, delta: -86.3 });
    expect(cards).toHaveLength(4);
    expect(cards[0].v).toBe(479088600);
    expect(cards[2].badge).toContain('86.3%');
  });

  it('builds realistic cards from apiDetail with sorted active days and newly started week', () => {
    const apiDetail = {
      totalTurnover: 119827414,
      from: '2026-10-10',
      to: '2026-11-09',
      weeks: [
        { weekFrom: '2026-11-02', weekTo: '2026-11-08', totalTurnover: 15000000, deltaPct: 10 },
        { weekFrom: '2026-11-09', weekTo: '2026-11-09', totalTurnover: 0, deltaPct: -100 },
      ],
      days: [
        { date: '2026-11-09', totalTurnover: 0 },
        { date: '2026-11-08', totalTurnover: 5000000 },
        { date: '2026-10-11', totalTurnover: 3290000 },
      ],
    };
    const cards = resolveCompanyCards({ numId: 62, apiDetail });
    expect(cards).toHaveLength(4);
    // 1. Umumiy aylanma
    expect(cards[0].v).toBe(119827414);
    expect(cards[0].badge).toBe('Ilk savdo: 11-okt');
    // 2. 1 oylik aylanma
    expect(cards[1].v).toBe(119827414);
    expect(cards[1].badge).toBe('2 kun savdo');
    // 3. Haftalik
    expect(cards[2].v).toBe(0);
    expect(cards[2].badge).toBe('Yangi hafta');
    expect(cards[2].sub).toContain('Joriy hafta · 9-noy');
    // 4. Kunlik
    expect(cards[3].v).toBe(0);
    expect(cards[3].badge).toBe('Oxirgi savdo: 8-noy');
  });

  it('builds dynamic donuts for non-103 companies', () => {
    const donuts = resolveCompanyDonuts({
      numId: 29,
      turnover: 100000000,
      fiscalTurnover: 98000000,
      nonFiscalTurnover: 2000000,
    });
    expect(donuts).toHaveLength(2);
    expect(donuts[0].pct).toBe('98%');
    expect(donuts[1].pct).toBe('2%');
  });

  it('resolves products for Aminjon Samarqand XK matching top items', () => {
    const products = resolveCompanyProducts({ numId: 29, companyName: 'Aminjon Samarqand XK' });
    expect(products.length).toBeGreaterThan(0);
    expect(products[0][0]).toContain('Плиты из травертина');
  });

  it('resolves receipts for non-103 company', () => {
    const receipts = resolveCompanyReceipts({
      numId: 29,
      companyName: 'Aminjon Samarqand XK',
      products: [['Плита', 1, 500000]],
    });
    expect(receipts.length).toBe(3);
    expect(receipts[0][10][0][0]).toBe('Плита');
  });
});
