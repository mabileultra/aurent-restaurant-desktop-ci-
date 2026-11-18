// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import BillingCompanyTableRow from './BillingCompanyTableRow';

describe('BillingCompanyTableRow', () => {
  afterEach(cleanup);

  it('renders company row details and handles click', () => {
    const row = {
      billing: {
        companyId: 'comp-1',
        companyName: 'Test Corp',
        monthlyTotal: 100000,
        balance: 50000,
        nextChargeAt: '2026-12-01',
        planName: 'Pro',
      },
      regionCode: 'TOS',
      districtCode: 'YUN',
      paymentState: 'ACTIVE',
    };
    const selectCompany = vi.fn();
    const toggleSelect = vi.fn();
    const p = {
      selectedCompanyId: null,
      selectCompany,
    };
    const c = {
      selectedIds: new Set(),
      toggleSelect,
    };

    render(
      <table>
        <tbody>
          <BillingCompanyTableRow
            row={row}
            p={p}
            c={c}
            regionName={() => 'Toshkent'}
            districtName={() => 'Yunusobod'}
            k={(key) => key}
            formatDate={(d) => d}
            money={(m) => String(m)}
            currency="UZS"
            t={(k) => k}
          />
        </tbody>
      </table>
    );

    expect(screen.getByText('Test Corp')).toBeTruthy();
    expect(screen.getByText('Pro')).toBeTruthy();
    expect(screen.getByText('100000 UZS')).toBeTruthy();

    fireEvent.click(screen.getByText('Test Corp'));
    expect(selectCompany).toHaveBeenCalledWith(row);
  });
});
