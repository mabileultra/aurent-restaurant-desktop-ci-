import { Download, Trash2, Upload } from 'lucide-react';
import { BaseButton } from '../../../../components/ui';
import IngredientsColumnPicker from './IngredientsColumnPicker';
import '../../styles/ingredients-toolbar.css';

export default function IngredientsToolbarActions({
  t,
  manage,
  columnDefs,
  visible,
  onToggleColumn,
  onImport,
  onExport,
  selectedCount,
  onBulkDelete,
}) {
  return (
    <div className="rst-ing-toolbar-actions">
      <IngredientsColumnPicker
        t={t}
        columnDefs={columnDefs}
        visible={visible}
        onToggle={onToggleColumn}
      />
      {manage ? (
        <>
          <BaseButton type="button" variant="ghost" onClick={onImport}>
            <Upload size={16} aria-hidden />
            {t('rst.nomenclature.import')}
          </BaseButton>
          <BaseButton type="button" variant="ghost" onClick={onExport}>
            <Download size={16} aria-hidden />
            {t('rst.nomenclature.export')}
          </BaseButton>
          {selectedCount > 0 ? (
            <BaseButton type="button" variant="danger" onClick={onBulkDelete}>
              <Trash2 size={16} aria-hidden />
              {t('rst.nomenclature.bulkDelete', { count: selectedCount })}
            </BaseButton>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
