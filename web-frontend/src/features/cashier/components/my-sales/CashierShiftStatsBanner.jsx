import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import { fmtMoney as fmt } from '../../../../utils/formatMoney';

export default function CashierShiftStatsBanner({ shift, t, compact = false, strip = false }) {
  const opened =
    shift?.openedAt != null ? format(new Date(shift.openedAt), 'dd.MM.yyyy HH:mm') : '—';

  if (strip) {
    return (
      <div className="cashier-sales-shift-strip" aria-label={t('pos.currentShiftSales')}>
        <Clock size={14} aria-hidden className="cashier-sales-shift-strip__icon" />
        <span className="cashier-sales-shift-strip__title">{t('pos.currentShiftSales')}</span>
        <span className="cashier-sales-shift-strip__item">
          <span className="cashier-sales-shift-strip__label">{t('pos.shiftOpenLabel')}</span>
          <span className="cashier-sales-shift-strip__value">{opened}</span>
        </span>
        <span className="cashier-sales-shift-strip__item">
          <span className="cashier-sales-shift-strip__label">{t('pos.shiftSales')}</span>
          <span className="cashier-sales-shift-strip__value">{shift?.saleCount ?? 0}</span>
        </span>
        <span className="cashier-sales-shift-strip__item">
          <span className="cashier-sales-shift-strip__label">{t('pos.total')}</span>
          <span className="cashier-sales-shift-strip__value cashier-sales-shift-strip__value--sum">
            {fmt(shift?.totalAmount)}
          </span>
        </span>
      </div>
    );
  }

  return (
    <div
      className={`cashier-sales-shift-stats flex-shrink-0${
        compact ? ' cashier-sales-shift-stats--compact' : ' mb-3'
      }`}
    >
      <div className="cashier-sales-shift-stats__icon">
        <Clock size={20} aria-hidden />
      </div>
      <div className="cashier-sales-shift-stats__body">
        <p className="cashier-sales-shift-stats__title">{t('pos.currentShiftSales')}</p>
        <div className="cashier-sales-shift-stats__grid">
          <div className="cashier-sales-shift-stats__item">
            <span className="cashier-sales-shift-stats__label">{t('pos.shiftOpenLabel')}</span>
            <span className="cashier-sales-shift-stats__value">{opened}</span>
          </div>
          <div className="cashier-sales-shift-stats__item">
            <span className="cashier-sales-shift-stats__label">{t('pos.shiftSales')}</span>
            <span className="cashier-sales-shift-stats__value">{shift?.saleCount ?? 0}</span>
          </div>
          <div className="cashier-sales-shift-stats__item">
            <span className="cashier-sales-shift-stats__label">{t('pos.total')}</span>
            <span className="cashier-sales-shift-stats__value cashier-sales-shift-stats__value--sum">
              {fmt(shift?.totalAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
