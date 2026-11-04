import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import BillingCompanyManageConfirmModal from './BillingCompanyManageConfirmModal';

globalThis.React = React;

describe('BillingCompanyManageConfirmModal', () => {
  const mockT = (key, opts) => {
    if (opts?.defaultValue) {
      let str = opts.defaultValue;
      if (opts.name) str = str.replace('{{name}}', opts.name);
      if (opts.amount) str = str.replace('{{amount}}', opts.amount);
      if (opts.currency) str = str.replace('{{currency}}', opts.currency);
      return str;
    }
    return key;
  };

  it('returns null when isOpen is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(BillingCompanyManageConfirmModal, {
        isOpen: false,
        type: 'debit',
        companyName: 'Akfa Medline',
        formattedAmount: '500 000',
        currency: 'UZS',
        onConfirm: vi.fn(),
        onClose: vi.fn(),
        t: mockT,
      })
    );
    expect(html).toBe('');
  });

  it('renders debit confirmation with company name and formatted amount', () => {
    const html = renderToStaticMarkup(
      React.createElement(BillingCompanyManageConfirmModal, {
        isOpen: true,
        type: 'debit',
        companyName: 'TEST Claude Dorixona',
        formattedAmount: '1 000',
        currency: 'so‘m',
        onConfirm: vi.fn(),
        onClose: vi.fn(),
        t: mockT,
      })
    );

    expect(html).toContain('Mablag‘ yechib olish');
    expect(html).toContain('TEST Claude Dorixona kompaniyasidan 1 000 so‘m yechib olinadi');
    expect(html).toContain('Yechib olish');
    expect(html).toContain('bc-btn--danger');
    expect(html).toContain('Bekor qilish');
  });

  it('renders credit confirmation with company name and formatted amount', () => {
    const html = renderToStaticMarkup(
      React.createElement(BillingCompanyManageConfirmModal, {
        isOpen: true,
        type: 'credit',
        companyName: 'Grand Pharm',
        formattedAmount: '2 500 000',
        currency: 'so‘m',
        onConfirm: vi.fn(),
        onClose: vi.fn(),
        t: mockT,
      })
    );

    expect(html).toContain('Hisobni to‘ldirish');
    expect(html).toContain('Grand Pharm kompaniyasi hisobiga 2 500 000 so‘m qo‘shiladi');
    expect(html).toContain('To‘ldirish');
    expect(html).toContain('bc-btn--ok');
  });

  it('renders block confirmation with company name', () => {
    const html = renderToStaticMarkup(
      React.createElement(BillingCompanyManageConfirmModal, {
        isOpen: true,
        type: 'block',
        companyName: 'Mironkul Agro',
        formattedAmount: '0',
        currency: 'so‘m',
        onConfirm: vi.fn(),
        onClose: vi.fn(),
        t: mockT,
      })
    );

    expect(html).toContain('Kompaniyani bloklash');
    expect(html).toContain('Mironkul Agro kompaniyasini bloklamoqchimisiz?');
    expect(html).toContain('Bloklash');
    expect(html).toContain('bc-btn--danger');
  });

  it('disables buttons when busy is true and shows loading text', () => {
    const html = renderToStaticMarkup(
      React.createElement(BillingCompanyManageConfirmModal, {
        isOpen: true,
        type: 'debit',
        companyName: 'Mironkul Agro',
        formattedAmount: '100 000',
        currency: 'so‘m',
        busy: true,
        onConfirm: vi.fn(),
        onClose: vi.fn(),
        t: mockT,
      })
    );

    expect(html).toMatch(/<button[^>]*disabled[^>]*>Bekor qilish<\/button>/);
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Yuklanmoqda…<\/button>/);
  });
});
