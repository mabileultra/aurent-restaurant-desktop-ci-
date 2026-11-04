export default function ReportProductNameCell({ name, sku, barcode, className = '' }) {
  const metaParts = [sku, barcode].map((v) => v?.trim()).filter(Boolean);
  const meta = metaParts.join(' · ');

  return (
    <td className={`px-4 py-3 ${className}`.trim()}>
      <div className="font-medium text-slate-900 dark:text-white">{name}</div>
      {meta ? <div className="text-xs text-slate-500">{meta}</div> : null}
    </td>
  );
}
