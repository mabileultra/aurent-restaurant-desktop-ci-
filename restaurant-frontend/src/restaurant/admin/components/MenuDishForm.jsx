import { BaseButton, BaseInput, BaseSelect } from '../../../components/ui';
import IngredientTasnifSearch from '../../../features/catalog/components/products/IngredientTasnifSearch';
import { useIngredientTasnifSearch } from '../../../features/catalog/hooks/useIngredientTasnifSearch';
import '../../../features/catalog/styles/ingredient-tasnif-search.css';
import RstMenuImage from '../../shared/components/RstMenuImage';
import RstModal from '../../shared/components/RstModal';
import PortionAmountField from './PortionAmountField';

export default function MenuDishForm({ p, photosEnabled = true }) {
  const tasnif = useIngredientTasnifSearch({
    form: p.form,
    patchForm: (patch) => p.setForm((prev) => ({ ...prev, ...patch })),
    isEdit: Boolean(p.editingId),
    fillName: 'ifEmpty',
  });

  return (
    <RstModal
      open={p.composerOpen}
      title={p.editingId
        ? p.t('rst.admin.editDish', { defaultValue: 'Изменить блюдо' })
        : p.t('rst.admin.addDish')}
      onClose={p.closeComposer}
      onSubmit={() => p.saveMutation.mutate()}
      isPending={p.saveMutation.isPending}
      asForm
      size="lg"
      cancelLabel={p.t('common.cancel')}
      submitLabel={p.editingId ? p.t('common.save') : p.t('rst.admin.addDish')}
    >
      <div className="rst-modal-form__grid rst-menu-modal__grid">
        <div className="rst-modal-form__full">
          <IngredientTasnifSearch
            t={tasnif.t}
            query={tasnif.query}
            onQueryChange={tasnif.setQuery}
            onSearch={tasnif.runSearch}
            loading={tasnif.loading}
            results={tasnif.results}
            error={tasnif.error}
            onPick={tasnif.pickItem}
            packageItem={tasnif.packageItem}
            lang={tasnif.lang}
            onPackageSelect={tasnif.handlePackageSelect}
            onPackageClose={tasnif.handlePackageClose}
            initialOpen
          />
        </div>
        <BaseInput
          label={p.t('productCatalog.ikpu')}
          value={p.form.ikpu}
          onChange={(e) => p.setForm({ ...p.form, ikpu: e.target.value })}
          placeholder={p.t('productCatalog.ikpuHint')}
        />
        <BaseInput
          label={p.t('productCatalog.packageCode')}
          value={p.form.packageCode}
          onChange={(e) => p.setForm({ ...p.form, packageCode: e.target.value })}
          placeholder={p.t('productCatalog.packageCodeHint')}
        />
        <BaseInput
          label={p.t('productCatalog.packageUnit')}
          value={p.form.unitOfMeasure}
          onChange={(e) => p.setForm({ ...p.form, unitOfMeasure: e.target.value })}
        />
        <BaseInput
          label={p.t('productModal.barcode')}
          value={p.form.barcode}
          onChange={(e) => p.setForm({ ...p.form, barcode: e.target.value })}
        />
        <label className="rst-admin-field rst-admin-field--check rst-modal-form__full">
          <span className="rst-admin-check">
            <input
              type="checkbox"
              checked={Boolean(p.form.markedProduct)}
              onChange={(e) => p.setForm({ ...p.form, markedProduct: e.target.checked })}
            />
            {p.t('productCatalog.marked')}
          </span>
        </label>
        <BaseInput
          label={p.t('rst.admin.dishName')}
          required
          value={p.form.name}
          onChange={(e) => p.setForm({ ...p.form, name: e.target.value })}
        />
        <BaseSelect
          size="sm"
          searchable={false}
          label={p.t('rst.admin.dishCategory')}
          value={p.form.menuCategoryId || ''}
          onChange={(e) => p.setForm({ ...p.form, menuCategoryId: e.target.value })}
          options={[
            { value: '', label: p.t('rst.admin.dishCategoryNone') },
            ...p.menuCategories.map((row) => ({ value: row.id, label: row.name })),
          ]}
        />
        <BaseInput
          label={p.t('rst.admin.sku')}
          value={p.form.sku}
          onChange={(e) => p.setForm({ ...p.form, sku: e.target.value })}
        />
        <BaseInput
          label={p.t('rst.admin.price')}
          type="number"
          min={0}
          step="0.01"
          required
          value={p.form.price}
          onChange={(e) => p.setForm({ ...p.form, price: e.target.value })}
        />
        <BaseSelect
          size="sm"
          searchable={false}
          label={p.t('rst.admin.vat')}
          value={String(p.form.taxRate ?? '0')}
          onChange={(e) => p.setForm({ ...p.form, taxRate: e.target.value })}
          options={[
            { value: '0', label: '0%' },
            { value: '12', label: '12%' },
          ]}
        />
        <BaseSelect
          size="sm"
          searchable={false}
          label={p.t('rst.admin.station')}
          value={p.form.stationId}
          onChange={(e) => p.setForm({ ...p.form, stationId: e.target.value })}
          options={[
            { value: '', label: p.t('rst.admin.noStation') },
            ...p.stations.map((station) => ({ value: station.id, label: station.name })),
          ]}
        />
        <BaseInput
          label={p.t('rst.admin.prepMinutes')}
          type="number"
          min={0}
          value={p.form.prepMinutes}
          onChange={(e) => p.setForm({ ...p.form, prepMinutes: e.target.value })}
          placeholder="15"
        />
        <PortionAmountField
          label={p.t('rst.admin.portionAmount')}
          value={p.form.portionAmount}
          unit={p.form.portionUnit}
          onChange={(portionAmount) => p.setForm({ ...p.form, portionAmount })}
          t={p.t}
        />
        <BaseSelect
          size="sm"
          searchable={false}
          label={p.t('rst.admin.portionUnit')}
          value={p.form.portionUnit || 'PORTION'}
          onChange={(e) => p.setForm({ ...p.form, portionUnit: e.target.value })}
          options={[
            { value: 'PORTION', label: p.t('rst.admin.portionUnitPortion') },
            { value: 'KG', label: p.t('rst.admin.portionUnitKg', { defaultValue: 'Килограммы (весовой)' }) },
            { value: 'G', label: p.t('rst.admin.portionUnitG') },
            { value: 'PCS', label: p.t('rst.admin.portionUnitPcs') },
          ]}
        />
        {p.form.portionUnit === 'KG' ? (
          <p className="rst-admin-field__hint rst-modal-form__full">
            {p.t('rst.admin.portionKgHint', {
              defaultValue: 'Весовой товар: цена за этот вес (макс. 10 кг). Официант выберет 100/200/300 г или 1 кг, либо введёт граммы/сумму.',
            })}
          </p>
        ) : null}
        <BaseInput
          label={p.t('rst.admin.portionLabel')}
          value={p.form.portionLabel}
          onChange={(e) => p.setForm({ ...p.form, portionLabel: e.target.value })}
          placeholder={p.t('rst.admin.portionLabelHint')}
        />
        <BaseInput
          label={p.t('rst.admin.dishTags')}
          value={p.form.tags}
          onChange={(e) => p.setForm({ ...p.form, tags: e.target.value })}
          placeholder={p.t('rst.admin.dishTagsHint')}
        />
        <div className="rst-modal-form__full">
          <BaseInput
            label={p.t('rst.admin.dishDescription')}
            value={p.form.description}
            onChange={(e) => p.setForm({ ...p.form, description: e.target.value })}
            placeholder={p.t('rst.admin.dishDescriptionHint')}
          />
        </div>
      </div>

      <div className="rst-modal-form__grid rst-menu-modal__extra">
        {photosEnabled ? (
          <div className="rst-admin-field">
            <span className="rst-admin-field__label">{p.t('rst.admin.dishImage')}</span>
            <label className="rst-file">
              <input
                className="rst-file__input"
                type="file"
                accept="image/*"
                onChange={(e) => p.onImageFile(e.target.files?.[0])}
              />
              <span className="rst-file__btn">{p.t('rst.admin.chooseFile')}</span>
              <span className="rst-file__name">
                {p.form.imageName || p.t('rst.admin.noFileSelected')}
              </span>
            </label>
            {p.form.imageUrl ? (
              <div className="rst-file__preview-wrap">
                <RstMenuImage imageUrl={p.form.imageUrl} className="rst-file__preview" />
                <BaseButton
                  type="button"
                  variant="ghost"
                  onClick={() => p.setForm({ ...p.form, imageUrl: '', imageName: '' })}
                >
                  {p.t('rst.admin.clearImage')}
                </BaseButton>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="rst-admin-field">
          <span className="rst-admin-field__label">{p.t('rst.admin.modifierGroups')}</span>
          <p className="rst-admin-field__hint mb-0">{p.t('rst.admin.modifierGroupsDishHint')}</p>
          {p.groups.length ? (
            <div className="rst-admin-chips">
              {p.groups.map((group) => {
                if (group.availableForAll) {
                  return (
                    <span key={group.id} className="rst-admin-chip is-on is-locked" title={p.t('rst.admin.modifierScopeAll')}>
                      {group.name}
                      <em>{p.t('rst.admin.modifierScopeAllShort')}</em>
                    </span>
                  );
                }
                const on = (p.form.modifierGroupIds ?? []).includes(group.id);
                return (
                  <label key={group.id} className={`rst-admin-chip${on ? ' is-on' : ''}`}>
                    <input type="checkbox" checked={on} onChange={() => p.toggleGroup(group.id)} />
                    {group.name}
                  </label>
                );
              })}
            </div>
          ) : (
            <span className="rst-admin-chip-empty">{p.t('rst.admin.noModifierGroups')}</span>
          )}
        </div>
      </div>
    </RstModal>
  );
}
