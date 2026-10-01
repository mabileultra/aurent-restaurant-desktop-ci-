import { fmtMoneyCompact } from '../../../../utils/formatMoney';
import FloorHallRail from '../../components/FloorHallRail';
import '../../styles/floor-hall-rail.css';

export default function CashierHallRail({
  halls = [],
  selectedHallId,
  onSelectHall,
  shift = null,
  shiftOpenLabel = null,
  t,
}) {
  const shiftHeader = (
    <div className={`rst-floor-hall-rail__shift${shift ? ' is-open' : ''}`}>
      {shift ? (
        <>
          <strong>{t('rst.cashier.shiftOpen')}</strong>
          {shiftOpenLabel ? <span>{shiftOpenLabel}</span> : null}
          <span>{t('rst.shift.total')}: {fmtMoneyCompact(shift.totalAmount)}</span>
        </>
      ) : (
        <strong>{t('rst.cashier.shiftClosed')}</strong>
      )}
    </div>
  );

  return (
    <FloorHallRail
      halls={halls}
      selectedHallId={selectedHallId}
      onSelectHall={onSelectHall}
      header={shiftHeader}
      t={t}
    />
  );
}
