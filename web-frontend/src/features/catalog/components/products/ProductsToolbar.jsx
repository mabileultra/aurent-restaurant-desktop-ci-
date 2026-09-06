// src/components/products/ProductsToolbar.jsx
import {
  Plus,
  Upload,
  Download,
  Percent,
  Trash2,
  Filter,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseButton } from '../../../../components/ui';

export default function ProductsToolbar({
  onAdd,
  onImport,
  onExport,
  onBulkVat,
  onDeleteAll,
  onOpenFilters,
  canManage,
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {canManage && (
        <>
          <BaseButton type="button" onClick={onAdd} className="admin-btn-primary text-sm">
            <Plus size={16} />
            {t('products.toolbar.add')}
          </BaseButton>
          <BaseButton type="button" variant="secondary" onClick={onImport} className="admin-btn-secondary text-sm">
            <Upload size={16} />
            {t('products.toolbar.import')}
          </BaseButton>
          <BaseButton type="button" variant="secondary" onClick={onExport} className="admin-btn-secondary text-sm">
            <Download size={16} />
            {t('products.toolbar.export')}
          </BaseButton>
          <BaseButton type="button" variant="secondary" onClick={onBulkVat} className="admin-btn-secondary text-sm">
            <Percent size={16} />
            {t('products.toolbar.bulkVat')}
          </BaseButton>
          <BaseButton type="button" variant="danger" onClick={onDeleteAll} className="text-sm">
            <Trash2 size={16} />
            {t('products.toolbar.deleteAll')}
          </BaseButton>
        </>
      )}
      <BaseButton type="button" variant="secondary" onClick={onOpenFilters} className="admin-btn-secondary text-sm">
        <Filter size={16} />
        {t('products.toolbar.filters')}
      </BaseButton>
    </div>
  );
}
