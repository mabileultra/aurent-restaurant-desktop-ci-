export function FiscalReceiptRow({ label, value, bold = false, nowrap = false, className = '', style }) {
  const classes = [
    'receipt-row',
    bold ? 'receipt-row--bold' : '',
    nowrap ? 'receipt-row--nowrap' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} style={style}>
      <span className="receipt-meta-label">{label}</span>
      <span className="receipt-row__value">{value}</span>
    </div>
  );
}

export function FiscalReceiptDivider() {
  return <div className="receipt-divider my-2 border-t border-dashed border-black" />;
}
