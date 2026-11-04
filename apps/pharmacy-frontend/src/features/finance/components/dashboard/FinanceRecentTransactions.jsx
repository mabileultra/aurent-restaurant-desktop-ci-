import { useState } from 'react';
import { formatMoney } from '../../utils/shared/formatMoney';
import FinanceRecentDetailModal from './FinanceRecentDetailModal';
import '../../../../styles/finance/recent-transactions.css';
import '../../../../styles/finance/chart-tooltip.css';

export default function FinanceRecentTransactions({ items, t }) {
  const [detailItem, setDetailItem] = useState(null);

  if (!items?.length) {
    return (
      <section className="finance-recent">
        <h2 className="finance-recent__title">{t('finance.dashboard.recentTransactions')}</h2>
        <p className="finance-recent__empty">{t('finance.dashboard.recentEmpty')}</p>
      </section>
    );
  }

  return (
    <>
      <section className="finance-recent">
        <h2 className="finance-recent__title">{t('finance.dashboard.recentTransactions')}</h2>
        <p className="finance-recent__hint">{t('finance.detail.recentClickHint')}</p>
        <div className="finance-recent__scroll">
          <ul className="finance-recent__list">
            {items.map((item, index) => (
              <li
                key={`${item.type}-${item.transactionDate}-${index}`}
                className="finance-recent__item"
                role="button"
                tabIndex={0}
                onClick={() => setDetailItem(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setDetailItem(item);
                  }
                }}
              >
                <div className="finance-recent__meta">
                  <span className={`finance-recent__badge finance-recent__badge--${item.type.toLowerCase()}`}>
                    {item.type === 'INCOME' ? t('finance.dashboard.income') : t('finance.dashboard.expense')}
                  </span>
                  <span className="finance-recent__source">{item.sourceType}</span>
                </div>
                <p className="finance-recent__title-text">{item.title}</p>
                <div className="finance-recent__footer">
                  <span className="finance-recent__date">{item.transactionDate}</span>
                  <span className={`finance-recent__amount finance-recent__amount--${item.type.toLowerCase()}`}>
                    {item.type === 'INCOME' ? '+' : '-'}{formatMoney(item.amount)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FinanceRecentDetailModal
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
        item={detailItem}
        t={t}
      />
    </>
  );
}
