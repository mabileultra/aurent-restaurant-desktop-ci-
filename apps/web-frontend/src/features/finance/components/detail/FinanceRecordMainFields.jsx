import React from 'react';
import {
  ArrowLeftRight,
  Building2,
  CreditCard,
  FileText,
  Pencil,
  Store,
  Tag,
  Wallet,
} from 'lucide-react';
import {
  financePaymentMethodLabel,
  financeSourceTypeLabel,
} from '../../utils/shared/financeSourceDocument';
import FinanceDetailFieldGrid, { FinanceDetailFieldCard } from './FinanceDetailFieldGrid';

function formatDateTime(value) {
  if (!value) return null;
  return new Date(value).toLocaleString();
}

export default function FinanceRecordMainFields({ record, kind, counterpartyLabel, t }) {
  if (!record) return null;

  return (
    <FinanceDetailFieldGrid>
      {kind === 'transfer' ? (
        <>
          <FinanceDetailFieldCard
            label={t('finance.transfers.from')}
            value={record.fromAccountName}
            icon={Wallet}
          />
          <FinanceDetailFieldCard
            label={t('finance.transfers.to')}
            value={record.toAccountName}
            icon={ArrowLeftRight}
          />
        </>
      ) : (
        <>
          <FinanceDetailFieldCard
            label={t('finance.common.category')}
            value={record.expenseCategoryName || record.incomeCategoryName}
            icon={Tag}
          />
          {kind === 'expense' ? (
            <FinanceDetailFieldCard
              label={t('finance.expenses.counterparty')}
              value={counterpartyLabel}
              icon={Building2}
            />
          ) : null}
          <FinanceDetailFieldCard
            label={t('finance.common.account')}
            value={record.accountName}
            icon={Wallet}
          />
          <FinanceDetailFieldCard
            label={t('finance.common.paymentMethod')}
            value={financePaymentMethodLabel(t, record.paymentMethod)}
            icon={CreditCard}
          />
          <FinanceDetailFieldCard
            label={t('finance.common.source')}
            value={financeSourceTypeLabel(t, record.sourceType)}
            icon={Pencil}
          />
        </>
      )}
      {record.storeId != null ? (
        <FinanceDetailFieldCard
          label={t('finance.detail.storeId')}
          value={String(record.storeId)}
          icon={Store}
        />
      ) : null}
      {record.currency ? (
        <FinanceDetailFieldCard
          label={t('finance.detail.currency')}
          value={record.currency}
          icon={FileText}
        />
      ) : null}
      {record.createdAt ? (
        <FinanceDetailFieldCard
          label={t('finance.detail.createdAt')}
          value={formatDateTime(record.createdAt)}
          icon={FileText}
        />
      ) : null}
    </FinanceDetailFieldGrid>
  );
}
