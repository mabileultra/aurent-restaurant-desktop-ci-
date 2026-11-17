import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftRight,
  Building2,
  CreditCard,
  FileText,
  Hash,
  Pencil,
  Store,
  Tag,
  Wallet,
} from 'lucide-react';
import { financeApi } from '../../../../api';
import { useTenantScope } from '../../../../hooks/useTenantScope';
import { formatMoney } from '../../utils/shared/formatMoney';
import {
  financePaymentMethodLabel,
  financeSourceTypeLabel,
  resolveFinanceSourceDocument,
} from '../../utils/shared/financeSourceDocument';
import FinanceDetailActions from '../detail/FinanceDetailActions';
import FinanceDetailDocumentLines from '../detail/FinanceDetailDocumentLines';
import FinanceDetailFieldGrid, { FinanceDetailFieldCard } from '../detail/FinanceDetailFieldGrid';
import FinanceDetailHero from '../detail/FinanceDetailHero';
import FinanceDetailMetaSection from '../detail/FinanceDetailMetaSection';
import FinanceDetailModalShell from '../detail/FinanceDetailModalShell';

function formatDateTime(value) {
  if (!value) return null;
  return new Date(value).toLocaleString();
}

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
