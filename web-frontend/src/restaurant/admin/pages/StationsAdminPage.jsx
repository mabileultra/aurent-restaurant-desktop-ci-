import { BaseButton, BaseInput } from '../../../components/ui';
import { useStationsAdminPage } from '../hooks/useStationsAdminPage';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';

export default function StationsAdminPage() {
  const p = useStationsAdminPage();

  if (p.workspace.noAssignment) {
    return <div className="rst-notice">{p.t('rst.floor.noStore')}</div>;
  }

  return (
    <section>
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{p.t('rst.admin.stationsTitle')}</h1>
          <p className="rst-coming__text mb-0">{p.t('rst.admin.stationsSubtitle')}</p>
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
          p.saveMutation.mutate();
        }}
      >
        <label className="col-md-2">
          <span className="d-block mb-1 small">{p.t('rst.admin.stationCode')}</span>
          <BaseInput value={p.form.code} onChange={(e) => p.setForm({ ...p.form, code: e.target.value })} required />
        </label>
        <label className="col-md-4">
          <span className="d-block mb-1 small">{p.t('rst.admin.stationName')}</span>
          <BaseInput value={p.form.name} onChange={(e) => p.setForm({ ...p.form, name: e.target.value })} required />
        </label>
        <label className="col-md-2">
          <span className="d-block mb-1 small">{p.t('rst.admin.sortOrder')}</span>
          <BaseInput
            type="number"
            min={0}
            value={p.form.sortOrder}
            onChange={(e) => p.setForm({ ...p.form, sortOrder: e.target.value })}
          />
        </label>
        <div className="col-md-4 d-flex gap-2">
          <BaseButton type="submit" disabled={p.saveMutation.isPending}>
            {p.editingId ? p.t('common.save') : p.t('rst.admin.addStation')}
          </BaseButton>
          {p.editingId ? (
            <BaseButton type="button" variant="ghost" onClick={p.resetForm}>{p.t('common.cancel')}</BaseButton>
          ) : null}
        </div>
      </form>

      <div className="rst-halls__table-list">
        {p.stations.filter((station) => station.active).map((station) => (
          <div key={station.id} className="rst-halls__row">
            <div>
              <strong>{station.name}</strong>
              <div className="rst-halls__row-meta">{station.code}</div>
            </div>
            <div className="d-flex gap-2">
              <BaseButton type="button" variant="ghost" onClick={() => p.startEdit(station)}>
                {p.t('common.edit')}
              </BaseButton>
              <BaseButton
                type="button"
                variant="ghost"
                onClick={() => {
                  if (window.confirm(p.t('rst.admin.confirmDeactivateStation'))) {
                    p.deactivateMutation.mutate(station.id);
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
