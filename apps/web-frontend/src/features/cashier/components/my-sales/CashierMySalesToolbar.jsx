import CashierSalesFilters from './CashierSalesFilters';
import CashierShiftStatsBanner from './CashierShiftStatsBanner';

export default function CashierMySalesToolbar({
  filters,
  onPatch,
  onReset,
  filtering,
  shift,
  shiftLoading,
  t,
}) {
  return (
    <div className="cashier-my-sales-toolbar cashier-my-sales-toolbar--stacked flex-shrink-0">
      <div className="cashier-my-sales-toolbar__filters">
        <CashierSalesFilters
          filters={filters}
          onPatch={onPatch}
          onReset={onReset}
          filtering={filtering}
          t={t}
          toolbar
        />
      </div>
      <div className="cashier-my-sales-toolbar__shift">
        {shiftLoading ? (
          <div className="cashier-sales-shift-strip cashier-sales-shift-strip--loading" aria-busy="true">
            <span className="cashier-sales-shift-strip__title">{t('common.loading')}</span>
          </div>
        ) : (
          <CashierShiftStatsBanner shift={shift} t={t} strip />
        )}
      </div>
    </div>
  );
}
