// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import FinanceRecordMainFields from './FinanceRecordMainFields';
import FinanceRecordTechnicalDetails from './FinanceRecordTechnicalDetails';

afterEach(cleanup);

describe('FinanceRecordDetail subcomponents', () => {
  const mockT = (key) => key;

  describe('FinanceRecordMainFields', () => {
    it('renders income/expense fields correctly', () => {
      const record = {
        amount: 100000,
        currency: 'UZS',
        incomeCategoryName: 'Consulting',
        accountName: 'Main Cash',
        paymentMethod: 'CASH',
        sourceType: 'MANUAL',
        storeId: 1,
      };

      render(
        <FinanceRecordMainFields
          record={record}
          kind="income"
          counterpartyLabel=""
          t={mockT}
        />
      );

      expect(screen.getByText('Consulting')).toBeDefined();
      expect(screen.getByText('Main Cash')).toBeDefined();
    });

    it('renders transfer fields correctly', () => {
      const record = {
        amount: 50000,
        fromAccountName: 'Cashbox 1',
        toAccountName: 'Bank Account',
      };

      render(
        <FinanceRecordMainFields
          record={record}
          kind="transfer"
          counterpartyLabel=""
          t={mockT}
        />
      );

      expect(screen.getByText('Cashbox 1')).toBeDefined();
      expect(screen.getByText('Bank Account')).toBeDefined();
    });
  });

  describe('FinanceRecordTechnicalDetails', () => {
    it('renders technical IDs when accordion is toggled open', () => {
      const record = {
        id: 'REC-999',
        expenseCategoryId: 'CAT-12',
        accountId: 'ACC-34',
        sourceId: 'SRC-56',
      };

      render(
        <FinanceRecordTechnicalDetails
          record={record}
          kind="expense"
          t={mockT}
        />
      );

      // Accordion starts closed, click button to expand
      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByText('REC-999')).toBeDefined();
      expect(screen.getByText('CAT-12')).toBeDefined();
      expect(screen.getByText('ACC-34')).toBeDefined();
      expect(screen.getByText('SRC-56')).toBeDefined();
    });
  });
});
