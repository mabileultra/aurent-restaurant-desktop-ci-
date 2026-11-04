export const inputCls = `product-catalog-field__control w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm
                  placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500
                  dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500`;

export const OWNER_TYPES = ['OWN', 'COMMISSION', 'AGENT'];
export const VAT_OPTIONS = [0, 1, 4, 6, 12, 15, 16, 20];

export function ProductCatalogField({ label, required, error, hint, children, className = '' }) {
  return (
    <div className={`product-catalog-field ${className}`.trim()}>
      <label className="product-catalog-field__label">
        {required && <span className="text-red-400">* </span>}
        {label}
      </label>
      <div className="product-catalog-field__control-wrap">{children}</div>
      {error ? <p className="product-catalog-field__error">{error}</p> : null}
      {hint ? <p className="product-catalog-field__hint">{hint}</p> : null}
    </div>
  );
}
