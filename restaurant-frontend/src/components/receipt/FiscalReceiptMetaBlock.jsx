import { FiscalReceiptRow } from './FiscalReceiptRow';

export default function FiscalReceiptMetaBlock({
  isOn,
  fs,
  time,
  date,
  receiptNumber,
  originalReceiptNumber,
  cashierName,
  shiftNo,
  labels,
}) {
  return (
    <section className="receipt-section mt-2 space-y-0.5">
      {isOn('dateTime') ? (
        <div {...fs('dateTime', 'receipt-row')}>
          <span>
            <span className="receipt-meta-label">{labels.time}: </span>
            {time}
          </span>
          <span className="receipt-row__value">
            <span className="receipt-meta-label">{labels.date}: </span>
            {date}
          </span>
        </div>
      ) : null}
      {isOn('receiptNo') ? (
        <div {...fs('receiptNo')}>
          <FiscalReceiptRow label={labels.receiptNo} value={`№${receiptNumber}`} />
        </div>
      ) : null}
      {originalReceiptNumber ? (
        <FiscalReceiptRow label={labels.originalReceiptNo} value={`№${originalReceiptNumber}`} />
      ) : null}
      {isOn('employee') && cashierName ? (
        <div {...fs('employee')}>
          <FiscalReceiptRow label={labels.employee} value={cashierName} />
        </div>
      ) : null}
      {isOn('shift') ? (
        <div {...fs('shift')}>
          <FiscalReceiptRow label={labels.shift} value={shiftNo} />
        </div>
      ) : null}
    </section>
  );
}
