import { BaseButton, BaseInput } from '../../../components/ui';
import TablePagination from '../../../components/shared/TablePagination';
import { useStationsAdminPage } from '../hooks/useStationsAdminPage';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/stations-admin.css';

export default function StationsAdminPage() {
  const p = useStationsAdminPage();

  if (p.workspace.noAssignment) {
    return <div className="rst-notice">{p.t('rst.floor.noStore')}</div>;
  }

  return (
    <section className="rst-stations">
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{p.t('rst.admin.stationsTitle')}</h1>
          <p className="rst-coming__text mb-0">{p.t('rst.admin.stationsSubtitle')}</p>
        </div>
      </div>

      <form
        className="rst-admin-form"
        onSubmit={(e) => {
          e.preventDefault();
          p.saveMutation.mutate();
        }}
      >
        <div className="rst-admin-form__grid">
          <label className="rst-admin-field">
            <span className="rst-admin-field__label">{p.t('rst.admin.stationCode')}</span>
            <BaseInput
              className="w-100"
              value={p.form.code}
              onChange={(e) => p.setForm({ ...p.form, code: e.target.value })}
              required
            />
          </label>
          <label className="rst-admin-field rst-admin-field--grow">
            <span className="rst-admin-field__label">{p.t('rst.admin.stationName')}</span>
            <BaseInput
              className="w-100"
              value={p.form.name}
              onChange={(e) => p.setForm({ ...p.form, name: e.target.value })}
              required
            />
          </label>
          <label className="rst-admin-field">
            <span className="rst-admin-field__label">{p.t('rst.admin.sortOrder')}</span>
            <BaseInput
              className="w-100"
              type="number"
              min={0}
              value={p.form.sortOrder}
              onChange={(e) => p.setForm({ ...p.form, sortOrder: e.target.value })}
            />
          </label>
        </div>
        <div className="rst-admin-form__actions">
          <BaseButton type="submit" disabled={p.saveMutation.isPending}>
            {p.editingId ? p.t('common.save') : p.t('rst.admin.addStation')}
          </BaseButton>
          {p.editingId ? (
            <BaseButton type="button" variant="ghost" onClick={p.resetForm}>
              {p.t('common.cancel')}
            </BaseButton>
          ) : null}
        </div>
      </form>

      <div className="rst-data-card">
        <div className="rst-data-card__head">
          <strong>{p.t('rst.admin.stationsList')}</strong>
          <span>{p.total}</span>
        </div>
        <div className="rst-data-card__table-wrap">
          <table className="rst-data-table">
            <thead>
              <tr>
                <th className="rst-data-table__num">#</th>
                <th>{p.t('rst.admin.stationCode')}</th>
                <th>{p.t('rst.admin.stationName')}</th>
                <th>{p.t('rst.admin.sortOrder')}</th>
                <th className="rst-data-table__actions">{p.t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {p.isLoading ? (
                <tr>
                  <td colSpan={5} className="rst-data-table__empty">{p.t('common.loading')}</td>
                </tr>
              ) : p.rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="rst-data-table__empty">{p.t('rst.admin.stationsEmpty')}</td>
                </tr>
              ) : (
                p.rows.map((station, index) => (
                  <tr key={station.id}>
                    <td className="rst-data-table__num">{p.page * p.pageSize + index + 1}</td>
                    <td><code>{station.code}</code></td>
                    <td>{station.name}</td>
                    <td>{station.sortOrder}</td>
                    <td className="rst-data-table__actions">
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {p.total > 0 ? (
          <TablePagination
            className="rst-data-card__pagination"
            page={p.page}
            pageSize={p.pageSize}
            total={p.total}
            totalPages={p.totalPages}
            pageSizeOptions={p.pageSizeOptions}
            onPageChange={p.setPage}
            onPageSizeChange={p.setPageSize}
          />
        ) : null}
      </div>
    </section>
  );
}
