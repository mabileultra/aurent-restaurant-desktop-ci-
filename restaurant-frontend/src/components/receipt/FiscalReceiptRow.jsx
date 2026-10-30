export function FiscalReceiptRow({ label, value, bold = false }) {
  return (
    <div className={`receipt-row${bold ? ' receipt-row--bold' : ''}`}>
      <span className="receipt-meta-label">{label}</span>
      <span className="receipt-row__value">{value}</span>
    </div>
  );
}

export function FiscalReceiptDivider() {
  return <div className="receipt-divider my-2 border-t border-dashed border-black" />;
}
