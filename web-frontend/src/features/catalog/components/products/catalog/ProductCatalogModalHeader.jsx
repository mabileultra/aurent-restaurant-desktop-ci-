import { X } from 'lucide-react';
import { CATALOG_PROFILE_RESTAURANT_INGREDIENT } from '../../../../../config/productCatalogConfig';

export default function ProductCatalogModalHeader({ t, isEdit, onClose, catalogProfile = null }) {
  const title = catalogProfile === CATALOG_PROFILE_RESTAURANT_INGREDIENT
    ? (isEdit ? t('productCatalog.editIngredientTitle') : t('productCatalog.addIngredientTitle'))
    : (isEdit ? t('productCatalog.editTitle') : t('productCatalog.addTitle'));

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
        {title}
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
