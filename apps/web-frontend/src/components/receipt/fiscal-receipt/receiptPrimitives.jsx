import React from 'react';

/** Строка чека «подпись — значение». */
export function ReceiptRow({ label, value, bold = false }) {
  return (
    <div className={`receipt-row${bold ? ' receipt-row--bold' : ''}`}>
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
