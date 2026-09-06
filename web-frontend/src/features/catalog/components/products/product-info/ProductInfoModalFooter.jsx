export default function ProductInfoModalFooter({ t, product, onEdit, onReceive, onDelete, onClose }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
      <button
        type="button"
        onClick={() => onEdit?.(product)}
        disabled={!product}
        className="admin-btn-primary px-4 py-2 text-sm"
      >
        {t('products.rowEdit')}
      </button>
      <button
        type="button"
        onClick={() => onReceive?.(product)}
        disabled={!product}
        className="admin-btn-primary px-4 py-2 text-sm"
      >
        {t('products.rowReceive')}
      </button>
      <button
        type="button"
        onClick={() => onDelete?.(product)}
        disabled={!product}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
      >
        {t('products.rowDelete')}
      </button>
      <button
        type="button"
        onClick={onClose}
        className="admin-btn-secondary px-4 py-2 text-sm"
      >
        {t('products.info.close')}
      </button>
    </div>
  );
}
