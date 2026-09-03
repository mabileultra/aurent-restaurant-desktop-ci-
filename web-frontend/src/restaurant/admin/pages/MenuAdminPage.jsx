import { Link } from 'react-router-dom';
import { BaseButton, BaseInput } from '../../../components/ui';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { useMenuAdminPage } from '../hooks/useMenuAdminPage';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/tech-card.css';

export default function MenuAdminPage() {
  const p = useMenuAdminPage();

  if (p.workspace.noAssignment) {
    return <div className="rst-notice">{p.t('rst.floor.noStore')}</div>;
  }

  return (
    <section>
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{p.t('rst.admin.menuTitle')}</h1>
          <p className="rst-coming__text mb-0">{p.t('rst.admin.menuSubtitle')}</p>
        </div>
        <Link className="rst-shell__footer-link" to="/rst/admin/recipes">{p.t('rst.admin.toRecipes')}</Link>
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
          p.saveMutation.mutate();
        }}
      >
        <label className="col-md-3">
          <span className="d-block mb-1 small">{p.t('rst.admin.dishName')}</span>
          <BaseInput value={p.form.name} onChange={(e) => p.setForm({ ...p.form, name: e.target.value })} required />
        </label>
        <label className="col-md-2">
          <span className="d-block mb-1 small">{p.t('rst.admin.dishCategory')}</span>
          <BaseInput
            value={p.form.category}
            placeholder={p.t('rst.admin.dishCategoryHint')}
            onChange={(e) => p.setForm({ ...p.form, category: e.target.value })}
          />
        </label>
        <label className="col-md-2">
          <span className="d-block mb-1 small">{p.t('rst.admin.sku')}</span>
          <BaseInput value={p.form.sku} onChange={(e) => p.setForm({ ...p.form, sku: e.target.value })} />
        </label>
        <label className="col-md-2">
          <span className="d-block mb-1 small">{p.t('rst.admin.price')}</span>
          <BaseInput
            type="number"
            min={0}
            step="0.01"
            value={p.form.price}
            onChange={(e) => p.setForm({ ...p.form, price: e.target.value })}
            required
          />
        </label>
        <label className="col-md-2">
          <span className="d-block mb-1 small">{p.t('rst.admin.station')}</span>
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
        <label className="col-md-3">
          <span className="d-block mb-1 small">{p.t('rst.admin.dishImage')}</span>
          <input type="file" accept="image/*" onChange={(e) => p.onImageFile(e.target.files?.[0])} />
          {p.form.imageUrl ? (
            <button type="button" className="btn btn-link btn-sm px-0" onClick={() => p.setForm({ ...p.form, imageUrl: '' })}>
              {p.t('rst.admin.clearImage')}
            </button>
          ) : null}
        </label>
        {p.form.imageUrl ? (
          <div className="col-md-2">
            <img src={p.form.imageUrl} alt="" className="rst-tech__preview" />
          </div>
        ) : null}
        <label className="col-md-4">
          <span className="d-block mb-1 small">{p.t('rst.admin.modifierGroups')}</span>
          <div className="d-flex flex-wrap gap-2">
            {p.groups.map((group) => (
              <label key={group.id} className="small d-flex gap-1 align-items-center">
                <input
                  type="checkbox"
                  checked={(p.form.modifierGroupIds ?? []).includes(group.id)}
                  onChange={() => p.toggleGroup(group.id)}
                />
                {group.name}
              </label>
            ))}
          </div>
        </label>
        <div className="col-md-2 d-flex gap-2">
          <BaseButton type="submit" disabled={p.saveMutation.isPending}>
            {p.editingId ? p.t('common.save') : p.t('rst.admin.addDish')}
          </BaseButton>
          {p.editingId ? (
            <BaseButton type="button" variant="ghost" onClick={p.resetForm}>{p.t('common.cancel')}</BaseButton>
          ) : null}
        </div>
      </form>

      <div className="rst-halls__table-list">
        {p.items.filter((item) => item.active).map((item) => (
          <div key={item.id} className="rst-halls__row">
            <div className="d-flex gap-3 align-items-center">
              {item.imageUrl ? <img src={item.imageUrl} alt="" className="rst-tech__dish-thumb" /> : null}
              <div>
                <strong>{item.name}</strong>
                <div className="rst-halls__row-meta">
                  {item.category ? `${item.category} · ` : ''}
                  {fmtMoneyCompact(item.price)}
                  {item.sku ? ` · ${item.sku}` : ''}
                  {p.stations.find((s) => s.id === item.stationId)?.name ? ` · ${p.stations.find((s) => s.id === item.stationId).name}` : ''}
                  {item.available ? '' : ` · ${p.t('rst.admin.unavailable')}`}
                </div>
              </div>
            </div>
            <div className="d-flex gap-2">
              <BaseButton type="button" variant="ghost" onClick={() => p.startEdit(item)}>
                {p.t('common.edit')}
              </BaseButton>
              <Link to="/rst/admin/recipes" className="btn btn-sm btn-outline-secondary">
                {p.t('rst.admin.toRecipe')}
              </Link>
              <BaseButton
                type="button"
                variant="ghost"
                onClick={() => {
                  if (window.confirm(p.t('rst.admin.confirmDeactivateDish'))) {
                    p.deactivateMutation.mutate(item.id);
                  }
                }}
              >
                {p.t('common.delete')}
              </BaseButton>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
