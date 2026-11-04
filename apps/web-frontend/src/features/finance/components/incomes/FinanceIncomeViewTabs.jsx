import clsx from 'clsx';

const TABS = [
  { id: 'revenue', labelKey: 'finance.incomes.viewRevenue' },
  { id: 'operations', labelKey: 'finance.incomes.viewOperations' },
  { id: 'all', labelKey: 'finance.incomes.viewAll' },
];

export default function FinanceIncomeViewTabs({ t, value, onChange }) {
  return (
    <div className="finance-income-tabs" role="tablist" aria-label={t('finance.incomes.viewTabs')}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          className={clsx('finance-income-tabs__btn', value === tab.id && 'finance-income-tabs__btn--active')}
          onClick={() => onChange(tab.id)}
        >
          {t(tab.labelKey)}
        </button>
      ))}
    </div>
  );
}
