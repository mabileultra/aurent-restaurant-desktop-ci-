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

  it('builds dynamic cards for non-103 companies', () => {
    const cards = resolveCompanyCards({ numId: 29, turnover: 479088600, delta: -86.3 });
    expect(cards).toHaveLength(4);
    expect(cards[0].v).toBe(479088600);
    expect(cards[2].badge).toContain('86.3%');
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
