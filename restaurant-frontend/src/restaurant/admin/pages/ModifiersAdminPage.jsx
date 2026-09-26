import { BaseButton, BaseInput } from '../../../components/ui';
import TablePagination from '../../../components/shared/TablePagination';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import RstFilterResetButton from '../../shared/components/RstFilterResetButton';
import RstRowActions from '../../shared/components/RstRowActions';
import { useModifiersAdminPage } from '../hooks/useModifiersAdminPage';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/stations-admin.css';

export default function ModifiersAdminPage() {
  const p = useModifiersAdminPage();

  if (p.workspace.noAssignment) {
    return <div className="rst-notice">{p.t('rst.floor.noStore')}</div>;
  }

  return (
    <section className="rst-modifiers">
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{p.t('rst.admin.modifiersTitle')}</h1>
          <p className="rst-coming__text mb-0">{p.t('rst.admin.modifiersSubtitle')}</p>
        </div>
      </div>

      <div className="rst-admin-filters">
        <label className="rst-admin-field">
          <span className="rst-admin-field__label">{p.t('common.search')}</span>
          <BaseInput
            value={p.filters.search}
            placeholder={p.t('rst.admin.modifiersSearchPh')}
            onChange={(e) => {
              p.setFilters({ ...p.filters, search: e.target.value });
              p.setPage(0);
            }}
          />
        </label>
        <RstFilterResetButton t={p.t} onClick={p.resetFilters} />
      </div>

      <form
        className="rst-admin-form"
        onSubmit={(e) => {
          e.preventDefault();
          p.saveGroup.mutate();
        }}
      >
        <div className="rst-admin-form__grid">
          <label className="rst-admin-field rst-admin-field--grow">
            <span className="rst-admin-field__label">{p.t('rst.admin.modifierGroupName')}</span>
            <BaseInput
              value={p.groupForm.name}
              onChange={(e) => p.setGroupForm({ ...p.groupForm, name: e.target.value })}
              required
            />
          </label>
          <label className="rst-admin-field">
            <span className="rst-admin-field__label">{p.t('rst.admin.minSelect')}</span>
            <BaseInput
              type="number"
              min={0}
              value={p.groupForm.minSelect}
              onChange={(e) => p.setGroupForm({ ...p.groupForm, minSelect: e.target.value })}
            />
          </label>
          <label className="rst-admin-field">
            <span className="rst-admin-field__label">{p.t('rst.admin.maxSelect')}</span>
            <BaseInput
              type="number"
              min={1}
              value={p.groupForm.maxSelect}
              onChange={(e) => p.setGroupForm({ ...p.groupForm, maxSelect: e.target.value })}
            />
          </label>
          <label className="rst-admin-field rst-admin-field--check">
            <span className="rst-admin-field__label">{p.t('rst.admin.modifierAvailableForAll')}</span>
            <label className="rst-admin-check">
              <input
                type="checkbox"
                checked={Boolean(p.groupForm.availableForAll)}
                onChange={(e) => p.setGroupForm({ ...p.groupForm, availableForAll: e.target.checked })}
              />
              <span>{p.t('rst.admin.modifierAvailableForAllHint')}</span>
            </label>
          </label>
        </div>
        <div className="rst-admin-form__actions">
          <BaseButton type="submit" disabled={p.saveGroup.isPending}>
            {p.editingGroupId ? p.t('common.save') : p.t('rst.admin.addModifierGroup')}
          </BaseButton>
          {p.editingGroupId ? (
            <BaseButton type="button" variant="ghost" onClick={p.resetGroup}>
              {p.t('common.cancel')}
            </BaseButton>
          ) : null}
        </div>
      </form>

      {p.optionGroup ? (
        <form
          className="rst-admin-form"
          onSubmit={(e) => {
            e.preventDefault();
            p.saveOption.mutate();
          }}
        >
          <div className="rst-admin-form__grid">
            <p className="rst-admin-form__note">
              {p.t('rst.admin.addOptionTo', { name: p.optionGroup.name })}
            </p>
            <label className="rst-admin-field rst-admin-field--grow">
              <span className="rst-admin-field__label">{p.t('rst.admin.optionName')}</span>
              <BaseInput
                value={p.optionForm.name}
                onChange={(e) => p.setOptionForm({ ...p.optionForm, name: e.target.value })}
                required
              />
            </label>
            <label className="rst-admin-field">
              <span className="rst-admin-field__label">{p.t('rst.admin.optionPrice')}</span>
              <BaseInput
                type="number"
                step="0.01"
                value={p.optionForm.priceDelta}
                onChange={(e) => p.setOptionForm({ ...p.optionForm, priceDelta: e.target.value })}
              />
            </label>
          </div>
          <div className="rst-admin-form__actions">
            <BaseButton type="submit" disabled={p.saveOption.isPending}>
              {p.t('common.add')}
            </BaseButton>
            <BaseButton
              type="button"
              variant="ghost"
              onClick={() => {
                p.setOptionGroupId(null);
                p.setOptionForm({ name: '', priceDelta: '0' });
              }}
            >
              {p.t('common.cancel')}
            </BaseButton>
          </div>
        </form>
      ) : null}

      <div className="rst-data-card">
        <div className="rst-data-card__head">
          <strong>{p.t('rst.admin.modifiersList')}</strong>
          <span>{p.total}</span>
        </div>
        <div className="rst-data-card__table-wrap">
          <table className="rst-data-table">
            <thead>
              <tr>
                <th className="rst-data-table__num">#</th>
                <th>{p.t('rst.admin.modifierGroupName')}</th>
                <th>{p.t('rst.admin.selectRangeLabel')}</th>
                <th>{p.t('rst.admin.modifierScope')}</th>
                <th>{p.t('rst.admin.options')}</th>
                <th className="rst-data-table__actions" aria-label={p.t('common.actions')} />
              </tr>
            </thead>
            <tbody>
              {p.isLoading ? (
                <tr>
                  <td colSpan={6} className="rst-data-table__empty">{p.t('common.loading')}</td>
                </tr>
              ) : p.rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="rst-data-table__empty">{p.t('rst.admin.modifiersEmpty')}</td>
                </tr>
              ) : (
                p.rows.map((group, index) => {
                  const options = group.options ?? [];
                  return (
                    <tr key={group.id}>
                      <td className="rst-data-table__num">{p.page * p.pageSize + index + 1}</td>
                      <td>{group.name}</td>
                      <td>{p.t('rst.admin.selectRange', { min: group.minSelect, max: group.maxSelect })}</td>
                      <td>
                        {group.availableForAll
                          ? p.t('rst.admin.modifierScopeAll')
                          : p.t('rst.admin.modifierScopeLinked')}
                      </td>
                      <td className="rst-data-table__wrap">
                        {options.length === 0 ? (
                          <span className="rst-halls__row-meta">{p.t('rst.admin.noOptions')}</span>
                        ) : (
                          options.map((option) => (
                            <div key={option.id} className="rst-halls__row-meta">
                              {option.name} · {fmtMoneyCompact(option.priceDelta)}
                            </div>
                          ))
                        )}
                      </td>
                      <td className="rst-data-table__actions">
                        <RstRowActions
                          t={p.t}
                          items={[
                            {
                              key: 'edit',
                              label: p.t('common.edit'),
                              onClick: () => p.startEditGroup(group),
                            },
                            {
                              key: 'option',
                              label: p.t('rst.admin.addOption'),
                              onClick: () => p.setOptionGroupId(group.id),
                            },
                            {
                              key: 'delete',
                              label: p.t('common.delete'),
                              danger: true,
                              onClick: () => {
                                if (window.confirm(p.t('rst.admin.confirmDeactivateModifierGroup'))) {
                                  p.deactivateGroup.mutate(group.id);
                                }
                              },
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })
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
