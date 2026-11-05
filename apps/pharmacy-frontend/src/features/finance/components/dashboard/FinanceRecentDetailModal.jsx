import { Pencil, Tag } from 'lucide-react';
import { formatMoney } from '../../utils/shared/formatMoney';
import { financeSourceTypeLabel } from '../../utils/shared/financeSourceDocument';
import FinanceDetailFieldGrid, { FinanceDetailFieldCard } from '../detail/FinanceDetailFieldGrid';
import FinanceDetailHero from '../detail/FinanceDetailHero';
import FinanceDetailModalShell from '../detail/FinanceDetailModalShell';

export default function FinanceRecentDetailModal({ open, onClose, item, t }) {
  const isIncome = item?.type === 'INCOME';
  const amountTone = isIncome ? 'income' : 'expense';
  const amountPrefix = isIncome ? '+' : '-';

  return (
    <FinanceDetailModalShell
      open={open}
      onClose={onClose}
      title={t('finance.detail.recentTitle')}
    >
      {item ? (
        <>
          <FinanceDetailHero
            amountLabel={t('finance.detail.amountLabel')}
            amount={`${amountPrefix}${formatMoney(item.amount)}`}
            amountTone={amountTone}
            date={item.transactionDate}
          />

          <FinanceDetailFieldGrid>
            <FinanceDetailFieldCard
              label={t('finance.detail.operationType')}
              value={isIncome ? t('finance.dashboard.income') : t('finance.dashboard.expense')}
              icon={Tag}
            />
            <FinanceDetailFieldCard
              label={t('finance.common.source')}
              value={financeSourceTypeLabel(t, item.sourceType)}
              icon={Pencil}
            />
          </FinanceDetailFieldGrid>

          {item.title ? (
            <div className="finance-detail-modal__section">
              <h3 className="finance-detail-modal__section-title">{t('finance.detail.description')}</h3>
              <p className="finance-detail-modal__comment">{item.title}</p>
            </div>
          ) : (
            <p className="finance-detail-modal__hint">{t('finance.detail.noDescription')}</p>
          )}
        </>
      ) : null}
    </FinanceDetailModalShell>
  );
}
