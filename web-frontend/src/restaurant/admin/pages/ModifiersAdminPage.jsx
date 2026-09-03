import { BaseButton, BaseInput } from '../../../components/ui';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { useModifiersAdminPage } from '../hooks/useModifiersAdminPage';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';

export default function ModifiersAdminPage() {
  const p = useModifiersAdminPage();

  if (p.workspace.noAssignment) {
    return <div className="rst-notice">{p.t('rst.floor.noStore')}</div>;
  }

  return (
    <section>
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{p.t('rst.admin.modifiersTitle')}</h1>
          <p className="rst-coming__text mb-0">{p.t('rst.admin.modifiersSubtitle')}</p>
        </div>
      </div>

      {p.workspace.canPickStore ? (
        <label className="rst-shell__store d-block mb-3">
          <span className="d-block mb-1 small">{p.t('rst.admin.selectStore')}</span>
          <select
            className="form-select"
            value={p.workspace.pickedStoreId}
            onChange={(e) => p.workspace.setPickedStoreId(e.target.value)}
          >
            <option value="">{p.t('rst.admin.selectStore')}</option>
            {p.workspace.restaurantStores.map((store) => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
        </label>
      ) : null}

      <form
        className="row g-2 align-items-end mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          p.saveGroup.mutate();
        }}
      >
        <label className="col-md-4">
          <span className="d-block mb-1 small">{p.t('rst.admin.modifierGroupName')}</span>
          <BaseInput value={p.groupForm.name} onChange={(e) => p.setGroupForm({ ...p.groupForm, name: e.target.value })} required />
        </label>
        <label className="col-md-2">
          <span className="d-block mb-1 small">{p.t('rst.admin.minSelect')}</span>
          <BaseInput type="number" min={0} value={p.groupForm.minSelect} onChange={(e) => p.setGroupForm({ ...p.groupForm, minSelect: e.target.value })} />
        </label>
        <label className="col-md-2">
          <span className="d-block mb-1 small">{p.t('rst.admin.maxSelect')}</span>
          <BaseInput type="number" min={1} value={p.groupForm.maxSelect} onChange={(e) => p.setGroupForm({ ...p.groupForm, maxSelect: e.target.value })} />
        </label>
        <div className="col-md-4 d-flex gap-2">
          <BaseButton type="submit" disabled={p.saveGroup.isPending}>
            {p.editingGroupId ? p.t('common.save') : p.t('rst.admin.addModifierGroup')}
          </BaseButton>
          {p.editingGroupId ? (
            <BaseButton type="button" variant="ghost" onClick={p.resetGroup}>{p.t('common.cancel')}</BaseButton>
          ) : null}
        </div>
      </form>

      <div className="rst-halls__table-list">
        {p.groups.map((group) => (
          <div key={group.id} className="rst-halls__row" style={{ alignItems: 'flex-start' }}>
            <div>
              <strong>{group.name}</strong>
              <div className="rst-halls__row-meta">
                {p.t('rst.admin.selectRange', { min: group.minSelect, max: group.maxSelect })}
              </div>
              {(group.options ?? []).map((option) => (
                <div key={option.id} className="rst-halls__row-meta">
                  {option.name} · {fmtMoneyCompact(option.priceDelta)}
                </div>
              ))}
              {p.optionGroupId === group.id ? (
                <form
                  className="d-flex gap-2 mt-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    p.saveOption.mutate();
                  }}
                >
                  <BaseInput
                    value={p.optionForm.name}
                    onChange={(e) => p.setOptionForm({ ...p.optionForm, name: e.target.value })}
                    placeholder={p.t('rst.admin.optionName')}
                    required
                  />
                  <BaseInput
                    type="number"
                    step="0.01"
                    value={p.optionForm.priceDelta}
                    onChange={(e) => p.setOptionForm({ ...p.optionForm, priceDelta: e.target.value })}
                  />
                  <BaseButton type="submit" disabled={p.saveOption.isPending}>{p.t('common.add')}</BaseButton>
                </form>
              ) : null}
            </div>
            <div className="d-flex gap-2">
              <BaseButton type="button" variant="ghost" onClick={() => p.startEditGroup(group)}>
                {p.t('common.edit')}
              </BaseButton>
              <BaseButton type="button" variant="ghost" onClick={() => p.setOptionGroupId(group.id)}>
                {p.t('rst.admin.addOption')}
              </BaseButton>
              <BaseButton type="button" variant="ghost" onClick={() => p.deactivateGroup.mutate(group.id)}>
                {p.t('common.delete')}
              </BaseButton>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
