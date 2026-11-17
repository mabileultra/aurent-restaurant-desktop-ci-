import React from 'react';
import { fmtMoneyCompact } from '../../../../utils/formatMoney';

/**
 * Блок открытой/закрытой смены в шапке панели навигации кассы ресторана.
 */
export default function CashierNavShiftHeader({
  shift,
  shiftOpenLabel,
  t,
}) {
  return (
    <div className={`rst-floor-hall-rail__shift rst-cashier-nav-lookup__shift${shift ? ' is-open' : ''}`}>
      {shift ? (
        <>
          <strong>{t('rst.cashier.shiftOpen')}</strong>
          {shiftOpenLabel ? <span>{shiftOpenLabel}</span> : null}
          <span>
            {t('rst.shift.total')}: {fmtMoneyCompact(shift.totalAmount)}
          </span>
        </>
      ) : (
        <strong>{t('rst.cashier.shiftClosed')}</strong>
      )}
    </div>
  );
}
