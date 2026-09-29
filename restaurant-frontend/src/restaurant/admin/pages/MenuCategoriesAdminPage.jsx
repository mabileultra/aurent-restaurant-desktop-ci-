import { BaseButton, BaseInput } from '../../../components/ui';
import TablePagination from '../../../components/shared/TablePagination';
import RstRowActions from '../../shared/components/RstRowActions';
import { useMenuCategoriesAdminPage } from '../hooks/useMenuCategoriesAdminPage';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/stations-admin.css';

export default function MenuCategoriesAdminPage() {
  const p = useMenuCategoriesAdminPage();

  if (p.workspace.noAssignment) {
    return <div className="rst-notice">{p.t('rst.floor.noStore')}</div>;
  }

  return (
    <section className="rst-stations">
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{p.t('rst.admin.menuCategoriesTitle')}</h1>
          <p className="rst-coming__text mb-0">{p.t('rst.admin.menuCategoriesSubtitle')}</p>
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
          <label className="rst-admin-field rst-admin-field--grow">
            <span className="rst-admin-field__label">{p.t('rst.admin.menuCategoryName')}</span>
            <BaseInput
              className="w-100"
              value={p.form.name}
              onChange={(e) => p.setForm({ ...p.form, name: e.target.value })}
              placeholder={p.t('rst.admin.menuCategoryNameHint')}
              required
            />
          </label>
          <label className="rst-admin-field rst-admin-field--check">
            <span className="rst-admin-field__label">{p.t('rst.admin.menuCategoryAutoPrint')}</span>
            <input
              type="checkbox"
              checked={Boolean(p.form.autoPrint)}
              onChange={(e) => p.setForm({
                ...p.form,
                autoPrint: e.target.checked,
                printStationId: e.target.checked ? p.form.printStationId : '',
              })}
            />
            <span className="rst-admin-field__hint">{p.t('rst.admin.menuCategoryAutoPrintHint')}</span>
          </label>
          {p.form.autoPrint ? (
            <label className="rst-admin-field">
              <span className="rst-admin-field__label">{p.t('rst.admin.menuCategoryPrintStation')}</span>
              <select
                className="form-select"
                value={p.form.printStationId || ''}
                required
                onChange={(e) => p.setForm({ ...p.form, printStationId: e.target.value })}
              >
                <option value="">{p.t('rst.admin.menuCategoryPrintStationHint')}</option>
                {p.stations.map((station) => (
                  <option key={station.id} value={station.id}>{station.name}</option>
                ))}
              </select>
            </label>
          ) : null}
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
            {p.editingId ? p.t('common.save') : p.t('rst.admin.addMenuCategory')}
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
          <strong>{p.t('rst.admin.menuCategoriesList')}</strong>
          <span>{p.total}</span>
        </div>
        <div className="rst-data-card__table-wrap">
          <table className="rst-data-table">
            <thead>
              <tr>
                <th className="rst-data-table__num">#</th>
                <th>{p.t('rst.admin.menuCategoryName')}</th>
                <th>{p.t('rst.admin.menuCategoryAutoPrint')}</th>
                <th>{p.t('rst.admin.sortOrder')}</th>
                <th className="rst-data-table__actions" aria-label={p.t('common.actions')} />
              </tr>
            </thead>
            <tbody>
              {p.isLoading ? (
                <tr>
                  <td colSpan={5} className="rst-data-table__empty">{p.t('common.loading')}</td>
                </tr>
              ) : p.rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="rst-data-table__empty">{p.t('rst.admin.menuCategoriesEmpty')}</td>
                </tr>
              ) : (
                p.rows.map((row, index) => (
                  <tr key={row.id}>
                    <td className="rst-data-table__num">{p.page * p.pageSize + index + 1}</td>
                    <td>{row.name}</td>
                    <td>
                      {row.autoPrint
                        ? (p.stations.find((station) => station.id === row.printStationId)?.name || p.t('rst.admin.menuCategoryAutoPrint'))
                        : '—'}
                    </td>
                    <td>{row.sortOrder}</td>
                    <td className="rst-data-table__actions">
                      <RstRowActions
                        t={p.t}
                        items={[
                          {
                            key: 'edit',
                            label: p.t('common.edit'),
                            onClick: () => p.startEdit(row),
                          },
                          {
                            key: 'delete',
                            label: p.t('common.delete'),
                            danger: true,
                            onClick: () => {
                              if (window.confirm(p.t('rst.admin.confirmDeactivateMenuCategory'))) {
                                p.deactivateMutation.mutate(row.id);
                              }
                            },
                          },
                        ]}
                      />
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
            onPageChange={p.setPage}
            onPageSizeChange={p.setPageSize}
            pageSizeOptions={p.pageSizeOptions}
          />
        ) : null}
      </div>
    </section>
  );
}
