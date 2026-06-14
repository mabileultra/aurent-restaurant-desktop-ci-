import { TrendingDown, TrendingUp } from 'lucide-react';
import { formatMoney } from '../../utils/shared/formatMoney';
import FinanceDetailFieldGrid, { FinanceDetailFieldCard } from '../detail/FinanceDetailFieldGrid';
import FinanceDetailHero from '../detail/FinanceDetailHero';
import FinanceDetailModalShell from '../detail/FinanceDetailModalShell';

export default function FinanceChartDayDetailModal({ open, onClose, day, t }) {
  const income = Number(day?.income) || 0;
  const expense = Number(day?.expense) || 0;
  const net = income - expense;

  return (
    <FinanceDetailModalShell
      open={open}
      onClose={onClose}
      title={t('finance.detail.dayTitle', { date: day?.date ?? '' })}
    >
      {day ? (
        <>
          <FinanceDetailHero
            amountLabel={t('finance.detail.dayNet')}
            amount={`${net >= 0 ? '+' : ''}${formatMoney(net)}`}
            amountTone={net >= 0 ? 'income' : 'expense'}
            date={day.date}
          />

          <FinanceDetailFieldGrid>
            <FinanceDetailFieldCard
              label={t('finance.dashboard.income')}
              value={`+${formatMoney(income)}`}
              icon={TrendingUp}
            />
            <FinanceDetailFieldCard
              label={t('finance.dashboard.expense')}
              value={`-${formatMoney(expense)}`}
              icon={TrendingDown}
            />
          </FinanceDetailFieldGrid>
        </>
      ) : null}
    </FinanceDetailModalShell>
  );
}
