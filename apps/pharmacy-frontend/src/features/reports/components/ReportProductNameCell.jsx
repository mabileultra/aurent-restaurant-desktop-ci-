export default function ReportProductNameCell({ name, sku, barcode, className = '' }) {
  const metaParts = [sku, barcode].map((v) => v?.trim()).filter(Boolean);
  const meta = metaParts.join(' · ');

  return (
    <td className={`ui-td ${className}`.trim()}>
      <div className="font-medium text-ink">{name}</div>
      {meta ? <div className="ui-tabular text-xs text-ink-muted">{meta}</div> : null}
    </td>
  );
}
