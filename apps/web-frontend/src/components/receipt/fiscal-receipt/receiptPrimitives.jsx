import React from 'react';

/** Строка чека «подпись — значение». */
export function ReceiptRow({ label, value, bold = false, nowrap = false }) {
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

export function ReceiptDivider({ dotted = false }) {
  return (
    <div
      className={`receipt-divider my-2 border-t ${dotted ? 'border-dotted' : 'border-dashed'} border-black`}
    />
  );
}
