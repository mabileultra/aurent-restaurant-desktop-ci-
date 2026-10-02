import { fmtMoneyCompact } from '../../../../utils/formatMoney';
import { resolveOrderHallName } from '../../utils/floorPosDerivations';
import '../styles/cashier-table-tile.css';

/**
 * One open check as a flat board row (hall · table · check · amount).
 */
export default function CashierCheckRow({
  table,
  check,
  halls = [],
  selected,
  onSelect,
  onPrefetchOrder,
  t,
}) {
  const hallName = resolveOrderHallName(halls, { tableId: table.id }, table.hallName);
  const billing = String(check?.status || '').toUpperCase() === 'BILLING';
  const statusKey = billing ? 'WAITING_PAYMENT' : (table.status || 'OCCUPIED');

  const warm = () => {
    if (check?.id && onPrefetchOrder) onPrefetchOrder(check.id);
  };

  return (
    <button
      type="button"
      className={`rst-cashier-tile rst-cashier-tile--check rst-cashier-tile--${billing ? 'WAITING_PAYMENT' : 'OCCUPIED'}${selected ? ' is-selected' : ''}`}
      onClick={() => onSelect?.(table, check?.id)}
      onPointerEnter={warm}
      onFocus={warm}
    >
      <span className="rst-cashier-tile__head">
        {hallName ? <span className="rst-cashier-tile__hall">{hallName}</span> : null}
        <span className="rst-cashier-tile__code">{table.code}</span>
      </span>
      <span className="rst-cashier-tile__check-no">
        {t('rst.floor.checkNo', { no: check?.orderNo })}
      </span>
      <span className="rst-cashier-tile__status">{t(`rst.status.${statusKey}`)}</span>
      <strong className="rst-cashier-tile__amount">{fmtMoneyCompact(check?.subtotal || 0)}</strong>
    </button>
  );
}
