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
    <div className="cashier-my-sales-toolbar flex-shrink-0">
      <div className="cashier-my-sales-toolbar__filters">
        <CashierSalesFilters
          filters={filters}
          onPatch={onPatch}
          onReset={onReset}
          filtering={filtering}
          t={t}
          compact
        />
      </div>
      <div className="cashier-my-sales-toolbar__shift">
        {shiftLoading ? (
          <div className="cashier-my-sales-toolbar__shift-placeholder" aria-busy="true">
            <p className="cashier-my-sales-toolbar__shift-placeholder-text">{t('common.loading')}</p>
          </div>
        ) : (
          <CashierShiftStatsBanner shift={shift} t={t} compact />
        )}
      </div>
    </div>
  );
}
