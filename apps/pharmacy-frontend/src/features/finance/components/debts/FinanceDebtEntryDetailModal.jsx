import { useQuery } from '@tanstack/react-query';
import { FileText, Hash, Tag } from 'lucide-react';
import { financeApi } from '../../../../api';
import { useTenantScope } from '../../../../hooks/useTenantScope';
import { formatMoney } from '../../utils/shared/formatMoney';
import { debtEntryTypeLabel } from '../../utils/debts/debtEntryLabels';
import FinanceDetailDocumentLines from '../detail/FinanceDetailDocumentLines';
import FinanceDetailFieldGrid, { FinanceDetailFieldCard } from '../detail/FinanceDetailFieldGrid';
import FinanceDetailHero from '../detail/FinanceDetailHero';
import FinanceDetailModalShell from '../detail/FinanceDetailModalShell';

const REFERENCE_LABELS = {
  RECEIPT: 'finance.detail.refReceipt',
  SALE: 'finance.detail.refSale',
  EXPENSE: 'finance.detail.refExpense',
  INCOME: 'finance.detail.refIncome',
  NONE: 'finance.detail.refNone',
};

export default function FinanceDebtEntryDetailModal({ open, onClose, entry, t }) {
  const { tenantKey, tenantReady } = useTenantScope();
  const kind = entry?.referenceKind;
  const refId = entry?.referenceId;

  const receiptQuery = useQuery({
    queryKey: tenantKey('finance-debt-receipt', refId),
    queryFn: () => financeApi.debts.documents.receipt(refId).then((r) => r.data),
    enabled: tenantReady && open && kind === 'RECEIPT' && !!refId,
  });

  const saleQuery = useQuery({
    queryKey: tenantKey('finance-debt-sale', refId),
    queryFn: () => financeApi.debts.documents.sale(refId).then((r) => r.data),
    enabled: tenantReady && open && kind === 'SALE' && !!refId,
  });

  const isLoading = kind === 'RECEIPT' ? receiptQuery.isLoading : saleQuery.isLoading;
  const receipt = receiptQuery.data;
  const sale = saleQuery.data;
  const hasDocument = Boolean(receipt || sale || isLoading);

  const amountTone = entry?.entryType === 'PAYMENT' ? 'income' : 'expense';

  return (
    <FinanceDetailModalShell
      open={open}
      onClose={onClose}
      title={t('finance.debts.detailTitle')}
      wide={hasDocument}
    >
      {entry ? (
        <>
          <FinanceDetailHero
            amountLabel={t('finance.detail.amountLabel')}
            amount={formatMoney(entry.amount)}
            amountTone={amountTone}
            date={entry.transactionDate}
          />

          <FinanceDetailFieldGrid>
            <FinanceDetailFieldCard
              label={t('finance.debts.historyType')}
              value={debtEntryTypeLabel(t, entry.entryType)}
              icon={Tag}
            />
            <FinanceDetailFieldCard
              label={t('finance.detail.documentLink')}
              value={t(REFERENCE_LABELS[kind] ?? REFERENCE_LABELS.NONE)}
              icon={FileText}
            />
            <FinanceDetailFieldCard
              label={t('finance.detail.recordId')}
              value={entry.id}
              icon={Hash}
              mono
            />
            {refId ? (
              <FinanceDetailFieldCard
                label={t('finance.detail.sourceId')}
                value={refId}
                icon={Hash}
                mono
              />
            ) : null}
          </FinanceDetailFieldGrid>

          {entry.comment ? (
            <div className="finance-detail-modal__section">
              <h3 className="finance-detail-modal__section-title">{t('finance.common.comment')}</h3>
              <p className="finance-detail-modal__comment">{entry.comment}</p>
            </div>
          ) : null}

          {isLoading ? (
            <p className="finance-detail-modal__hint">{t('finance.detail.documentLoading')}</p>
          ) : null}

          {!receipt && !sale && !isLoading && entry.entryType === 'PAYMENT' ? (
            <p className="finance-detail-modal__hint">{t('finance.debts.detailPaymentHint')}</p>
          ) : null}

          {!receipt && !sale && !isLoading && entry.entryType === 'CHARGE' && (kind === 'NONE' || !kind) ? (
            <p className="finance-detail-modal__hint">{t('finance.debts.detailNoDocument')}</p>
          ) : null}

          <FinanceDetailDocumentLines t={t} isLoading={isLoading} receipt={receipt} sale={sale} />
        </>
      ) : null}
    </FinanceDetailModalShell>
  );
}
