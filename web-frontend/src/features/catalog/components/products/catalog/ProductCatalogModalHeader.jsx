import { X } from 'lucide-react';

export default function ProductCatalogModalHeader({ t, isEdit, onClose }) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
        {isEdit ? t('productCatalog.editTitle') : t('productCatalog.addTitle')}
      </h2>
      <button
        type="button"
        onClick={onClose}
        className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
      >
        <X size={20} />
      </button>
    </div>
  );
}
