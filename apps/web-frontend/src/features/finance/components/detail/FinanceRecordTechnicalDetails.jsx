import React from 'react';
import { Hash } from 'lucide-react';
import { FinanceDetailFieldCard } from './FinanceDetailFieldGrid';
import FinanceDetailMetaSection from './FinanceDetailMetaSection';

export default function FinanceRecordTechnicalDetails({ record, kind, t }) {
  if (!record) return null;

  return (
    <FinanceDetailMetaSection title={t('finance.detail.technicalDetails')}>
      <FinanceDetailFieldCard
        label={t('finance.detail.recordId')}
        value={record.id}
        icon={Hash}
        mono
      />
      {kind !== 'transfer' && record.expenseCategoryId ? (
        <FinanceDetailFieldCard
          label={t('finance.detail.categoryId')}
          value={record.expenseCategoryId}
          icon={Hash}
          mono
        />
      ) : null}
      {kind !== 'transfer' && record.incomeCategoryId ? (
        <FinanceDetailFieldCard
          label={t('finance.detail.categoryId')}
          value={record.incomeCategoryId}
          icon={Hash}
          mono
        />
      ) : null}
      {kind !== 'transfer' && record.accountId ? (
        <FinanceDetailFieldCard
          label={t('finance.detail.accountId')}
          value={record.accountId}
          icon={Hash}
          mono
        />
      ) : null}
      {kind === 'transfer' && record.fromAccountId ? (
        <FinanceDetailFieldCard
          label={t('finance.detail.fromAccountId')}
          value={record.fromAccountId}
          icon={Hash}
          mono
        />
      ) : null}
      {kind === 'transfer' && record.toAccountId ? (
        <FinanceDetailFieldCard
          label={t('finance.detail.toAccountId')}
          value={record.toAccountId}
          icon={Hash}
          mono
        />
      ) : null}
      {record.sourceId ? (
        <FinanceDetailFieldCard
          label={t('finance.detail.sourceId')}
          value={record.sourceId}
          icon={Hash}
          mono
        />
      ) : null}
    </FinanceDetailMetaSection>
  );
}
