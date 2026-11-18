import React from 'react';
import { formatItemCommittentReceiptLine } from '@aurent/shared-fiscal';
import { fmtMoneyCompact, fmtQty } from '../../../utils/fiscalReceiptFormat';
import { unitCodeFromLabel } from '../../../utils/unitConfig';
import { itemUnitPrice, lineVatAmount, lineVatRatePercent } from './receiptLineMath';
import { ReceiptDivider, ReceiptRow } from './receiptPrimitives';

/** Позиции чека: наименование, количество × цена, НДС и ИКПУ строки. */
export default function ReceiptItemsSection({ sale, isOn, t }) {
  if (!isOn('items')) return null;

  return (
    <>
      <ReceiptDivider />
      <section className="receipt-section min-w-0">
        <div className="receipt-items-table space-y-2.5">
          {(sale.items ?? []).map((item, index) => {
            const committent = formatItemCommittentReceiptLine(item, {
              committentTin: t('receipt.committentTin'),
              committentPinfl: t('receipt.committentPinfl'),
            });

            return (
              <div key={index} className="receipt-items-table__item border-b border-dotted border-black pb-2 last:border-0">
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
                    <ReceiptRow
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
                {committent ? (
                  <p className="break-all receipt-secondary">
                    {committent.text}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
