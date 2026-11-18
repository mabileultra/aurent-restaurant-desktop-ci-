import React from 'react';
import { formatItemCommittentReceiptLine } from '@aurent/shared-fiscal';
import { fmtMoneyCompact, fmtQty } from '../../utils/fiscalReceiptFormat';
import { extractVatFromInclusive } from '../../utils/taxAmounts';
import { unitCodeFromLabel } from '../../utils/unitConfig';

function lineVatRatePercent(item) {
  const rate = item?.taxRatePercent != null ? Number(item.taxRatePercent) : 12;
  return Number.isFinite(rate) && rate > 0 ? rate : 0;
}

function lineVatAmount(item) {
  const stored = Number(item?.taxAmount);
  if (Number.isFinite(stored) && stored >= 0.001) return stored;
  const rate = lineVatRatePercent(item);
  const lineTotal = Number(item?.lineTotal) || 0;
  return extractVatFromInclusive(lineTotal, rate);
}

function itemUnitPrice(item) {
  const direct = Number(item?.unitPrice ?? item?.price ?? item?.sellingPrice);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const qty = Number(item?.quantity) || 0;
  const total = Number(item?.lineTotal) || 0;
  return qty > 0 ? total / qty : total;
}

export function PharmacyReceiptRow({ label, value, bold = false, nowrap = false }) {
  const classes = [
    'receipt-row',
    bold ? 'receipt-row--bold' : '',
    nowrap ? 'receipt-row--nowrap' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <span className="receipt-meta-label">{label}</span>
      <span className="receipt-row__value">{value}</span>
    </div>
  );
}

export function PharmacyReceiptDivider() {
  return <div className="receipt-divider my-2 border-t border-dashed border-black" />;
}

export default function PharmacyReceiptItemsAndTotals({ sale, isOn, vatRateLabel, t }) {
  return (
    <>
      {isOn('items') ? (
        <>
          <PharmacyReceiptDivider />
          <section className="receipt-section min-w-0">
            <div className="receipt-items-table space-y-2.5">
              {(sale.items ?? []).map((item, idx) => (
                <div
                  key={idx}
                  className="receipt-items-table__item border-b border-dotted border-black pb-2 last:border-0"
                >
                  <p className="receipt-items-table__name">{item.productName}</p>
                  <p className="receipt-items-table__qtyline">
                    {fmtQty(item.quantity, item.saleType, unitCodeFromLabel(item.unitOfMeasure))}
                    {' * '}
                    {fmtMoneyCompact(itemUnitPrice(item))}
                    {' = '}
                    {fmtMoneyCompact(item.lineTotal)}
                  </p>
                  {isOn('itemVatLine') ? (
                    <div className="receipt-items-table__vat">
                      <PharmacyReceiptRow
                        label={t('fiscalReceipt.vatLineShort', {
                          rate: lineVatRatePercent(item).toFixed(0),
                        })}
                        value={fmtMoneyCompact(lineVatAmount(item))}
                      />
                    </div>
                  ) : null}
                  {isOn('itemIkpu') && item.ikpu ? (
                    <p className="break-all receipt-secondary">
                      {t('receipt.ikpuLine')}: {item.ikpu}
                    </p>
                  ) : null}
                  {(() => {
                    const committent = formatItemCommittentReceiptLine(item, {
                      committentTin: t('receipt.committentTin'),
                      committentPinfl: t('receipt.committentPinfl'),
                    });
                    if (!committent) return null;
                    return (
                      <p className="break-all receipt-secondary">
                        {committent.text}
                      </p>
                    );
                  })()}
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {(isOn('discounts') || isOn('grandTotal') || isOn('vatTotal')) && (
        <>
          <PharmacyReceiptDivider />
          <section className="receipt-section space-y-0.5">
            {isOn('discounts') && Number(sale.lineDiscountTotal ?? 0) > 0 ? (
              <PharmacyReceiptRow
                label={t('fiscalReceipt.lineDiscountsSum')}
                value={fmtMoneyCompact(sale.lineDiscountTotal)}
              />
            ) : null}
            {isOn('discounts') && Number(sale.orderDiscountAmount ?? 0) > 0 ? (
              <PharmacyReceiptRow
                label={
                  Number(sale.orderDiscountPercent ?? 0) > 0
                    ? t('fiscalReceipt.orderDiscountPercent', { percent: sale.orderDiscountPercent })
                    : t('fiscalReceipt.orderDiscountSum')
                }
                value={fmtMoneyCompact(sale.orderDiscountAmount)}
              />
            ) : null}
            {isOn('discounts') && Number(sale.discountTotal) > 0 ? (
              <PharmacyReceiptRow
                label={t('fiscalReceipt.discountsSum')}
                value={fmtMoneyCompact(sale.discountTotal)}
                bold
              />
            ) : null}
            {isOn('grandTotal') ? (
              <PharmacyReceiptRow
                label={t('fiscalReceipt.grandTotal')}
                value={fmtMoneyCompact(sale.totalAmount)}
                bold
              />
            ) : null}
            {isOn('vatTotal') ? (
              <PharmacyReceiptRow
                label={t('fiscalReceipt.vatTotalLine', { rate: vatRateLabel })}
                value={fmtMoneyCompact(sale.taxTotal)}
                bold
              />
            ) : null}
          </section>
        </>
      )}
    </>
  );
}
