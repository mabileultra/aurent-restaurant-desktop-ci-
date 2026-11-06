import { useMemo } from 'react';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { computeCashierHallSummary } from '../utils/computeCashierHallSummary';

export default function PosHardwareBar({ t, halls = [], shift = null }) {
  const summary = useMemo(() => computeCashierHallSummary(halls), [halls]);
  const paid = Number(shift?.totalAmount) || 0;

  return (
    <footer className="rst-pos__hw">
      <span className="rst-pos__hw-stat">
        {t('rst.pos.hwOccupied', { count: summary.occupied })}
      </span>
      <span className="rst-pos__hw-stat">
        {t('rst.pos.hwOpenSum', { amount: fmtMoneyCompact(summary.openSum) })}
      </span>
      <span className="rst-pos__hw-stat">
        {t('rst.pos.hwPaidShift', { amount: fmtMoneyCompact(paid) })}
      </span>
      <span className="rst-pos__hw-sep" aria-hidden="true" />
      <span>{t('rst.pos.hwFiscal')}</span>
      <span>{t('rst.pos.hwPin')}</span>
      <span>{t('rst.pos.hwKitchen')}</span>
      <span className="rst-pos__hw-right">{t('rst.pos.hwOnline')}</span>
    </footer>
  );
}
