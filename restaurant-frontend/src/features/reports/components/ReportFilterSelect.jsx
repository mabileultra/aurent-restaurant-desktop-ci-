import '../styles/report-store-select.css';

/** Compact labeled select for report filter bars (same size as store select). */
export default function ReportFilterSelect({
  label,
  value,
  onChange,
  options = [],
  emptyLabel,
}) {
  return (
    <label className="rst-report-filter">
      {label ? <span className="rst-report-filter__label">{label}</span> : null}
      <select
        className="rst-report-filter__select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {emptyLabel != null ? <option value="">{emptyLabel}</option> : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  );
}
