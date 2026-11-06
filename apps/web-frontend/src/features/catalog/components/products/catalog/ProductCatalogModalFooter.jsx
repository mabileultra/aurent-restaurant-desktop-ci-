import { Loader } from 'lucide-react';

export default function ProductCatalogModalFooter({ t, isEdit, isPending, onClose }) {
  return (
    <>
      <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800 dark:border-sky-800/50 dark:bg-sky-950/30 dark:text-sky-400/90">
        {t('productCatalog.requiredHint')}
      </p>

      <div className="flex gap-3 border-t border-slate-200 pt-2 dark:border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="admin-btn-secondary flex-1 py-2.5 text-sm"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="admin-btn-primary flex flex-1 py-2.5 text-sm"
        >
          {isPending && <Loader size={14} className="animate-spin" />}
          {isEdit ? t('productModal.saveChanges') : t('productCatalog.submitAdd')}
        </button>
      </div>
    </>
  );
}
