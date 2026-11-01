import { inputCls } from '../../../../../../utils/productImportUtils';
import './product-import-ikpu-cell.css';

/** ИКПУ в предпросмотре импорта — всегда читаемый mono-блок. */
export default function ProductImportIkpuCell({
  value,
  editable = false,
  onChange,
  placeholder = '—',
}) {
  const display = String(value ?? '').trim();

  if (editable) {
    return (
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        value={display}
        onChange={(e) => onChange?.(e.target.value)}
        className={`${inputCls} product-import-ikpu-cell__input`}
        placeholder={placeholder}
        title={display || undefined}
      />
    );
  }

  if (!display) {
    return <span className="product-import-ikpu-cell product-import-ikpu-cell--empty">—</span>;
  }

  return (
    <span className="product-import-ikpu-cell" title={display}>
      {display}
    </span>
  );
}
