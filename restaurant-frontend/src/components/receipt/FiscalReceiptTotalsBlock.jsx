import { fmtMoneyCompact } from '../../utils/fiscalReceiptFormat';
import { FiscalReceiptDivider, FiscalReceiptRow } from './FiscalReceiptRow';

function serviceLabel(sale, t) {
  const percent = Number(sale.servicePercent) || 0;
  if (percent > 0) {
    return t('rst.order.serviceLine', {
      percent,
      defaultValue: `Обслуживание ${percent}%`,
    });
  }
  return t('rst.order.serviceShort', { defaultValue: 'Обслуживание' });
}

export default function FiscalReceiptTotalsBlock({ sale, isOn, fs, t, vatRateLabel }) {
  const serviceAmt = Number(sale.serviceAmount ?? sale.commissionAmount) || 0;

  return (
    <>
      <FiscalReceiptDivider />
      <section className="receipt-section space-y-0.5">
        {isOn('service') && serviceAmt > 0 ? (
          <div {...fs('service')}>
            <FiscalReceiptRow label={serviceLabel(sale, t)} value={fmtMoneyCompact(serviceAmt)} />
          </div>
        ) : null}
        {isOn('discounts') && Number(sale.lineDiscountTotal ?? 0) > 0 ? (
          <div {...fs('discounts')}>
            <FiscalReceiptRow
              label={t('fiscalReceipt.lineDiscountsSum')}
              value={fmtMoneyCompact(sale.lineDiscountTotal)}
            />
          </div>
        ) : null}
        {isOn('discounts') && Number(sale.orderDiscountAmount ?? 0) > 0 ? (
          <div {...fs('discounts')}>
            <FiscalReceiptRow
              label={
                Number(sale.orderDiscountPercent ?? 0) > 0
                  ? t('fiscalReceipt.orderDiscountPercent', { percent: sale.orderDiscountPercent })
                  : t('fiscalReceipt.orderDiscountSum')
              }
              value={fmtMoneyCompact(sale.orderDiscountAmount)}
            />
          </div>
        ) : null}
        {isOn('discounts') && Number(sale.discountTotal) > 0 ? (
          <div {...fs('discounts')}>
            <FiscalReceiptRow
              label={t('fiscalReceipt.discountsSum')}
              value={fmtMoneyCompact(sale.discountTotal)}
              bold
            />
          </div>
        ) : null}
        {isOn('grandTotal') ? (
          <div {...fs('grandTotal')}>
            <FiscalReceiptRow
              label={t('fiscalReceipt.grandTotal')}
              value={fmtMoneyCompact(sale.totalAmount)}
              bold
            />
          </div>
        ) : null}
        {isOn('vatTotal') ? (
          <div {...fs('vatTotal')}>
            <FiscalReceiptRow
              label={t('fiscalReceipt.vatTotalLine', { rate: vatRateLabel })}
              value={fmtMoneyCompact(sale.taxTotal)}
              bold
            />
          </div>
        ) : null}
      </section>
    </>
  );
}
