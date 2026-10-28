import { BaseInput, BaseSelect } from '../../../components/ui';
import RstMenuImage from '../../shared/components/RstMenuImage';

export default function MenuDishImportRowEditor({
  row,
  t,
  stations,
  menuCategories,
  disabled,
  onChange,
  onImageFile,
}) {
  if (!row) {
    return (
      <div className="rst-menu-import__editor-empty">
        {t('rst.admin.menuImportPickRow')}
      </div>
    );
  }

  const draft = row.draft || {};

  return (
    <div className="rst-menu-import__editor">
      <p className="rst-menu-import__editor-title">
        {t('rst.admin.menuImportRowTitle', { row: row.rowNum, name: row.name || '—' })}
      </p>

      <div className="rst-menu-import__editor-grid">
        <BaseInput
          label={t('rst.admin.dishName')}
          required
          disabled={disabled}
          value={draft.name || ''}
          onChange={(e) => onChange({ name: e.target.value })}
        />
        <BaseInput
          label={t('rst.admin.price')}
          type="number"
          min={0}
          step="0.01"
          required
          disabled={disabled}
          value={draft.price ?? ''}
          onChange={(e) => onChange({ price: e.target.value })}
        />
        <BaseSelect
          size="sm"
          searchable={false}
          label={t('rst.admin.dishCategory')}
          disabled={disabled}
          value={draft.menuCategoryId || ''}
          onChange={(e) => onChange({ menuCategoryId: e.target.value || null })}
          options={[
            { value: '', label: t('rst.admin.dishCategoryNone') },
            ...menuCategories.map((cat) => ({ value: cat.id, label: cat.name })),
          ]}
        />
        <BaseSelect
          size="sm"
          searchable={false}
          label={t('rst.admin.station')}
          disabled={disabled}
          value={draft.stationId || ''}
          onChange={(e) => onChange({ stationId: e.target.value || null })}
          options={[
            { value: '', label: t('rst.admin.noStation') },
            ...stations.map((station) => ({ value: station.id, label: station.name })),
          ]}
        />
        <BaseInput
          label={t('rst.admin.sku')}
          disabled={disabled}
          value={draft.sku || ''}
          onChange={(e) => onChange({ sku: e.target.value })}
        />
        <BaseInput
          label={t('rst.admin.portionAmount')}
          disabled={disabled}
          value={draft.portionAmount ?? ''}
          onChange={(e) => onChange({ portionAmount: e.target.value })}
        />
        <BaseSelect
          size="sm"
          searchable={false}
          label={t('rst.admin.portionUnit')}
          disabled={disabled}
          value={draft.portionUnit || 'PORTION'}
          onChange={(e) => onChange({ portionUnit: e.target.value })}
          options={[
            { value: 'PORTION', label: t('rst.admin.portionUnitPortion') },
            { value: 'KG', label: t('rst.admin.portionUnitKg') },
            { value: 'G', label: t('rst.admin.portionUnitG') },
            { value: 'PCS', label: t('rst.admin.portionUnitPcs') },
          ]}
        />
        <BaseInput
          label={t('rst.admin.prepMinutes')}
          type="number"
          min={0}
          disabled={disabled}
          value={draft.prepMinutes ?? ''}
          onChange={(e) => onChange({ prepMinutes: e.target.value })}
        />
        <BaseInput
          label={t('productCatalog.ikpu')}
          disabled={disabled}
          value={draft.ikpu || ''}
          onChange={(e) => onChange({ ikpu: e.target.value })}
        />
        <BaseInput
          label={t('productCatalog.packageCode')}
          disabled={disabled}
          value={draft.packageCode || ''}
          onChange={(e) => onChange({ packageCode: e.target.value })}
        />
        <BaseInput
          label={t('productModal.barcode')}
          disabled={disabled}
          value={draft.barcode || ''}
          onChange={(e) => onChange({ barcode: e.target.value })}
        />
        <label className="rst-admin-field rst-admin-field--check">
          <span className="rst-admin-check">
            <input
              type="checkbox"
              disabled={disabled}
              checked={Boolean(draft.markedProduct)}
              onChange={(e) => onChange({ markedProduct: e.target.checked })}
            />
            {t('productCatalog.marked')}
          </span>
        </label>
        <div className="rst-menu-import__editor-full">
          <BaseInput
            label={t('rst.admin.dishDescription')}
            disabled={disabled}
            value={draft.description || ''}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </div>
        <div className="rst-menu-import__editor-full rst-admin-field">
          <span className="rst-admin-field__label">{t('rst.admin.dishImage')}</span>
          {draft.imageUrl ? (
            <div className="rst-menu-import__photo">
              <RstMenuImage imageUrl={draft.imageUrl} />
              <button
                type="button"
                className="rst-file__clear"
                disabled={disabled}
                onClick={() => onChange({ imageUrl: null })}
              >
                {t('common.delete')}
              </button>
            </div>
          ) : null}
          <label className="rst-file">
            <input
              className="rst-file__input"
              type="file"
              accept="image/*"
              disabled={disabled}
              onChange={(e) => {
                const next = e.target.files?.[0];
                e.target.value = '';
                if (next) onImageFile(next);
              }}
            />
            <span className="rst-file__btn">{t('rst.admin.menuImportPickPhoto')}</span>
          </label>
          <p className="rst-admin-field__hint">{t('rst.admin.menuImportPhotoHint')}</p>
        </div>
      </div>

      <p className="rst-menu-import__tasnif-meta">
        {row.tasnifStatus === 'ok'
          ? t('rst.admin.menuImportTasnifOk', { name: row.tasnifMatchedName || draft.ikpu || '—' })
          : null}
        {row.tasnifStatus === 'miss' ? t('rst.admin.menuImportTasnifMiss') : null}
        {row.tasnifStatus === 'idle' ? t('rst.admin.menuImportTasnifIdle') : null}
        {row.tasnifStatus === 'loading' ? t('common.loading') : null}
        {row.tasnifStatus === 'skip' ? t('rst.admin.menuImportTasnifSkip') : null}
      </p>
    </div>
  );
}
