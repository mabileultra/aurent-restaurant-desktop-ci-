import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '../../../../api';
import { useTenantScope } from '../../../../hooks/useTenantScope';
import { formatMoney } from '../../utils/shared/formatMoney';
import { resolveFinanceSourceDocument } from '../../utils/shared/financeSourceDocument';
import FinanceDetailActions from '../detail/FinanceDetailActions';
import FinanceDetailDocumentLines from '../detail/FinanceDetailDocumentLines';
import FinanceDetailHero from '../detail/FinanceDetailHero';
import FinanceDetailModalShell from '../detail/FinanceDetailModalShell';
import FinanceRecordMainFields from '../detail/FinanceRecordMainFields';
import FinanceRecordTechnicalDetails from '../detail/FinanceRecordTechnicalDetails';

export default function FinanceRecordDetailModal({
  open,
  onClose,
  kind,
  record,
  t,
  onEdit,
  onDelete,
  canEdit = false,
  counterpartyLabel,
}) {
  const { tenantKey, tenantReady } = useTenantScope();
  const sourceDoc = record
    ? resolveFinanceSourceDocument(record.sourceType, record.sourceId)
    : null;

  const receiptQuery = useQuery({
    queryKey: tenantKey('finance-record-receipt', sourceDoc?.id),
    queryFn: () => financeApi.debts.documents.receipt(sourceDoc.id).then((r) => r.data),
    enabled: tenantReady && open && sourceDoc?.kind === 'RECEIPT',
  });

  const saleQuery = useQuery({
    queryKey: tenantKey('finance-record-sale', sourceDoc?.id),
    queryFn: () => financeApi.debts.documents.sale(sourceDoc.id).then((r) => r.data),
    enabled: tenantReady && open && sourceDoc?.kind === 'SALE',
  });

  const title = kind === 'expense'
    ? t('finance.detail.expenseTitle')
    : kind === 'income'
      ? t('finance.detail.incomeTitle')
      : t('finance.detail.transferTitle');

  const receipt = receiptQuery.data;
  const sale = saleQuery.data;
  const docLoading = sourceDoc?.kind === 'RECEIPT'
    ? receiptQuery.isLoading
    : sourceDoc?.kind === 'SALE'
      ? saleQuery.isLoading
      : false;

  const amountTone = kind === 'expense' ? 'expense' : kind === 'income' ? 'income' : 'neutral';
  const hasDocument = Boolean(receipt || sale || docLoading);
  const hasActions = canEdit && (onEdit || onDelete);

  const handleEdit = onEdit
    ? () => {
        onClose();
        onEdit(record);
      }
    : null;

  const handleDelete = onDelete
    ? () => {
        onClose();
        onDelete(record);
      }
    : null;

  return (
    <FinanceDetailModalShell
      open={open}
      onClose={onClose}
      title={title}
      layout="record"
      wide={hasDocument}
      footer={hasActions ? (
        <FinanceDetailActions t={t} onEdit={handleEdit} onDelete={handleDelete} />
      ) : null}
    >
      {record ? (
        <>
          <FinanceDetailHero
            amountLabel={t('finance.detail.amountLabel')}
            amount={formatMoney(record.amount, record.currency)}
            amountTone={amountTone}
            date={record.transactionDate}
          />

          <FinanceRecordMainFields
            record={record}
            kind={kind}
            counterpartyLabel={counterpartyLabel}
            t={t}
          />

          <FinanceRecordTechnicalDetails
            record={record}
            kind={kind}
            t={t}
          />

          {record.comment ? (
            <div className="finance-detail-modal__section">
              <h3 className="finance-detail-modal__section-title">{t('finance.common.comment')}</h3>
              <p className="finance-detail-modal__comment">{record.comment}</p>
            </div>
          ) : null}

          {sourceDoc && docLoading ? (
            <p className="finance-detail-modal__hint">{t('finance.detail.documentLoading')}</p>
          ) : null}

          <FinanceDetailDocumentLines t={t} isLoading={docLoading} receipt={receipt} sale={sale} />
        </>
      ) : null}
    </FinanceDetailModalShell>
  );
}
