import { useEffect, useState } from 'react';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { guestBillScreenHeader } from '../../shared/printProfile/applyPrintProfile';
import { loadStorePrintProfile } from '../../shared/printProfile/loadStorePrintProfile';
import { formatTicketItemLines } from '../utils/buildRestaurantTicketBody';
import { ticketStamp } from '../utils/ticketLayout';
import './restaurant-ordinary-receipt.css';

function paymentMethodLabel(method, t) {
  const m = String(method || 'CASH').toUpperCase();
  if (m === 'CARD') return t('sales.paymentCard', { defaultValue: 'Карта' });
  if (m === 'CASHLESS') return t('sales.paymentCashless', { defaultValue: 'Безналичная' });
  if (m === 'MIXED') return t('salesLedger.filters.mixed', { defaultValue: 'Смешанная' });
  return t('sales.paymentCash', { defaultValue: 'Наличные' });
}

/** On-screen guest sale slip when the order was not fiscalized (no tax integration). */
export default function RestaurantOrdinaryReceipt({ sale, t }) {
  const storeId = sale?.storeId;
  const [header, setHeader] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadStorePrintProfile(storeId).then((profile) => {
      if (!cancelled) setHeader(guestBillScreenHeader(profile));
    });
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  if (!sale) return null;

  const items = (sale.items || []).filter((row) => !row.isServiceLine);
  const service = Number(sale.serviceAmount) || 0;
  const discount = Number(sale.discountTotal ?? sale.orderDiscountAmount) || 0;
  const subtotal = Number(sale.subtotal) || 0;
  const totalAmount = Number(sale.totalAmount) || 0;
  const vat = Number(sale.taxTotal) || 0;
  const methodLabel = paymentMethodLabel(sale.paymentMethod, t);
  const when = sale.createdAt ? ticketStamp(sale.createdAt) : ticketStamp();
  const cashier = sale.cashierName || sale.employeeName || '';
  const footer =
    header?.footer
    || t('rst.order.billFooter', { defaultValue: 'Спасибо за визит!' });

  return (
    <div className="rst-ord-receipt" aria-label={t('rst.order.ordinaryReceipt')}>
      {header?.logoDataUrl ? (
        <img
          className="rst-ord-receipt__logo"
          src={header.logoDataUrl}
          alt=""
          style={{ maxHeight: `${header.logoMaxHeightMm || 12}mm` }}
        />
      ) : null}
      {header?.companyName ? <p className="rst-ord-receipt__store">{header.companyName}</p> : null}
      {header?.companyAddress ? <p className="rst-ord-receipt__meta">{header.companyAddress}</p> : null}
      {header?.companyPhone ? <p className="rst-ord-receipt__meta">{header.companyPhone}</p> : null}

      <p className="rst-ord-receipt__title">{t('rst.order.ordinaryReceipt')}</p>
      {sale.storeName && sale.storeName !== header?.companyName ? (
        <p className="rst-ord-receipt__store">{sale.storeName}</p>
      ) : null}
      <p className="rst-ord-receipt__meta">
        №{sale.receiptNumber || sale.id || '—'} · {when}
      </p>
      {sale.customerName ? <p className="rst-ord-receipt__meta">{sale.customerName}</p> : null}
      {cashier ? (
        <p className="rst-ord-receipt__meta">
          {t('fiscalReceipt.cashier', { defaultValue: 'Кассир' })}: {cashier}
        </p>
      ) : null}

      <hr className="rst-ord-receipt__rule" />
      {items.length ? (
        items.map((item, idx) => (
          <div key={idx} className="rst-ord-receipt__line">
            {formatTicketItemLines(item).map((row, i) => (
              <div key={i}>{row}</div>
            ))}
          </div>
        ))
      ) : (
        <p className="rst-ord-receipt__meta">{t('rst.order.emptyLines', { defaultValue: 'Нет позиций' })}</p>
      )}
      <hr className="rst-ord-receipt__rule" />

      <div className="rst-ord-receipt__row">
        <span>{t('rst.order.subtotalShort', { defaultValue: 'Подытог' })}</span>
        <strong>{fmtMoneyCompact(subtotal)}</strong>
      </div>
      {service > 0 ? (
        <div className="rst-ord-receipt__row">
          <span>{t('rst.order.serviceShort', { defaultValue: 'Обслуживание' })}</span>
          <strong>{fmtMoneyCompact(service)}</strong>
        </div>
      ) : null}
      {discount > 0 ? (
        <div className="rst-ord-receipt__row">
          <span>{t('rst.order.discount', { defaultValue: 'Скидка' })}</span>
          <strong>−{fmtMoneyCompact(discount)}</strong>
        </div>
      ) : null}
      <p className="rst-ord-receipt__meta">
        {t('rst.order.paymentFormLine', { method: methodLabel, defaultValue: `Форма оплаты: ${methodLabel}` })}
      </p>
      {vat > 0 ? (
        <div className="rst-ord-receipt__row">
          <span>{t('rst.order.vatShort', { defaultValue: 'НДС' })}</span>
          <strong>{fmtMoneyCompact(vat)}</strong>
        </div>
      ) : null}
      <div className="rst-ord-receipt__row rst-ord-receipt__row--grand">
        <span>{t('rst.order.totalDue', { defaultValue: 'ИТОГО' })}</span>
        <strong>{fmtMoneyCompact(totalAmount)}</strong>
      </div>
      {Number(sale.changeGiven) > 0 ? (
        <div className="rst-ord-receipt__row">
          <span>{t('fiscalReceipt.change', { defaultValue: 'Сдача' })}</span>
          <strong>{fmtMoneyCompact(sale.changeGiven)}</strong>
        </div>
      ) : null}

      <p className="rst-ord-receipt__footer">{footer}</p>
    </div>
  );
}
