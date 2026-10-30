import { fmtMoneyCompact, fmtQty } from '../../utils/fiscalReceiptFormat';
import { unitCodeFromLabel } from '../../utils/unitConfig';
import { FiscalReceiptDivider, FiscalReceiptRow } from './FiscalReceiptRow';
import { itemUnitPrice, lineVatAmount, lineVatRatePercent } from './fiscalReceiptLineHelpers';

export default function FiscalReceiptItemsBlock({ items, isOn, fs, t }) {
  return (
    <>
      <FiscalReceiptDivider />
      <section {...fs('items', 'receipt-section min-w-0')}>
        <div className="receipt-items-table space-y-2.5">
          {(items ?? []).map((item, idx) => (
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
                <div {...fs('itemVatLine', 'receipt-items-table__vat')}>
                  <FiscalReceiptRow
                    label={t('fiscalReceipt.vatLineShort', {
                      rate: lineVatRatePercent(item).toFixed(0),
                    })}
                    value={fmtMoneyCompact(lineVatAmount(item))}
                  />
                </div>
              ) : null}
              {isOn('itemIkpu') && item.ikpu ? (
                <p {...fs('itemIkpu', 'break-all receipt-secondary')}>
                  {t('receipt.ikpuLine')}: {item.ikpu}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
