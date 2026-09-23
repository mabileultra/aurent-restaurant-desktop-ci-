import { BaseButton, BaseInput } from '../../../components/ui';
import RstModal from '../../shared/components/RstModal';

export default function MenuDishForm({ p }) {
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
        <BaseInput
          label={p.t('rst.admin.dishName')}
          required
          value={p.form.name}
          onChange={(e) => p.setForm({ ...p.form, name: e.target.value })}
        />
        <BaseInput
          label={p.t('rst.admin.dishCategory')}
          value={p.form.category}
          placeholder={p.t('rst.admin.dishCategoryHint')}
          onChange={(e) => p.setForm({ ...p.form, category: e.target.value })}
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
        <label className="rst-admin-field">
          <span className="rst-admin-field__label">{p.t('rst.admin.station')}</span>
          <select
            className="form-select"
            value={p.form.stationId}
            onChange={(e) => p.setForm({ ...p.form, stationId: e.target.value })}
          >
            <option value="">{p.t('rst.admin.noStation')}</option>
            {p.stations.map((station) => (
              <option key={station.id} value={station.id}>{station.name}</option>
            ))}
          </select>
        </label>
        <BaseInput
          label={p.t('rst.admin.prepMinutes')}
          type="number"
          min={0}
          value={p.form.prepMinutes}
          onChange={(e) => p.setForm({ ...p.form, prepMinutes: e.target.value })}
          placeholder="15"
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
              <img src={p.form.imageUrl} alt="" className="rst-file__preview" />
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

        <div className="rst-admin-field">
          <span className="rst-admin-field__label">{p.t('rst.admin.modifierGroups')}</span>
          {p.groups.length ? (
            <div className="rst-admin-chips">
              {p.groups.map((group) => {
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
