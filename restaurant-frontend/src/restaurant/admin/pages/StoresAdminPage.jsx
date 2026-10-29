import { Link } from 'react-router-dom';
import { BaseButton, BaseInput } from '../../../components/ui';
import RestaurantStoreFormModal from '../components/RestaurantStoreFormModal';
import RstRowActions from '../../shared/components/RstRowActions';
import { useStoresAdminPage } from '../hooks/useStoresAdminPage';
import { isDesktopPrinter } from '../../pos/utils/desktopPrinters';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/stores-admin.css';

const OFFLINE_STORE_ID_BASE = 1_900_000_000;

export default function StoresAdminPage() {
  const p = useStoresAdminPage();
  const desktop = isDesktopPrinter();

  return (
    <section className="rst-stores">
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{p.t('rst.admin.storesTitle')}</h1>
          <p className="rst-coming__text mb-0">{p.t('rst.admin.storesSubtitle')}</p>
        </div>
        <div className="rst-halls__actions">
          <BaseButton type="button" onClick={p.openCreate}>
            {p.t('rst.admin.addRestaurant')}
          </BaseButton>
        </div>
      </div>

      <div className="rst-stores__hint">
        {p.t('rst.admin.storesAccessHint')}
        {' '}
        <Link to="/rst/admin/staff">{p.t('rst.nav.staff')}</Link>
        {' · '}
        <Link to="/rst/admin/integrations">{p.t('rst.nav.integrations')}</Link>
      </div>

      {desktop ? (
        <div className="rst-stores__hint">
          {p.t('rst.admin.storesLocalCreateHint', {
            defaultValue:
              'Новая точка создаётся на этом ПК сразу (и без сети). В облако она попадёт только после отдельного синка/создания на платформе.',
          })}
        </div>
      ) : null}

      <label className="rst-admin-field rst-admin-field--full">
        <span className="rst-admin-field__label">{p.t('common.search')}</span>
        <BaseInput
          value={p.search}
          onChange={(e) => p.setSearch(e.target.value)}
          placeholder={p.t('rst.admin.storesSearchPh')}
        />
      </label>

      {p.isError ? (
        <div className="rst-notice">
          <p className="mb-2">{p.t('rst.admin.storesLoadFailed')}</p>
          {p.refetch ? (
            <BaseButton type="button" onClick={p.refetch}>
              {p.t('common.retry', { defaultValue: 'Повторить' })}
            </BaseButton>
          ) : null}
        </div>
      ) : p.isLoading ? (
        <div className="rst-empty">{p.t('common.loading')}</div>
      ) : p.rows.length === 0 ? (
        <div className="rst-empty">
          <strong>{p.t('rst.admin.storesEmpty')}</strong>
          <p className="mb-0">{p.t('rst.admin.storesEmptyHint')}</p>
          <BaseButton type="button" className="mt-3" onClick={p.openCreate}>
            {p.t('rst.admin.addRestaurant')}
          </BaseButton>
        </div>
      ) : (
        <div className="rst-stores__list">
          {p.rows.map((row) => {
            const isCurrent = Number(row.id) === Number(p.workspace.storeId);
            const localOnly = Number(row.id) >= OFFLINE_STORE_ID_BASE;
            return (
              <article
                key={row.id}
                className={`rst-stores__card${isCurrent ? ' is-current' : ''}${row.active === false ? ' is-off' : ''}`}
              >
                <div className="rst-stores__card-main">
                  <div className="rst-stores__card-title">
                    <h2>{row.name}</h2>
                    {isCurrent ? (
                      <span className="rst-stores__badge">{p.t('rst.admin.storeCurrentBadge')}</span>
                    ) : null}
                    {localOnly ? (
                      <span className="rst-stores__badge">
                        {p.t('rst.admin.storeLocalBadge', { defaultValue: 'Локально' })}
                      </span>
                    ) : null}
                    {row.active === false ? (
                      <span className="rst-stores__badge rst-stores__badge--off">{p.t('common.inactive')}</span>
                    ) : null}
                  </div>
                  <p className="rst-stores__meta">
                    {p.t(`rst.admin.storeType_${row.businessType}`, {
                      defaultValue: row.businessType,
                    })}
                    {row.address ? ` · ${row.address}` : ''}
                    {row.phone ? ` · ${row.phone}` : ''}
                  </p>
                </div>
                <div className="rst-stores__card-actions">
                  <RstRowActions
                    t={p.t}
                    items={[
                      !isCurrent && row.active !== false
                        ? {
                            key: 'use',
                            label: p.t('rst.admin.useRestaurant'),
                            onClick: () => p.useAsWorkspace(row),
                          }
                        : null,
                      {
                        key: 'edit',
                        label: p.t('common.edit'),
                        onClick: () => p.openEdit(row),
                      },
                      {
                        key: 'integrations',
                        label: p.t('rst.nav.integrations'),
                        to: '/rst/admin/integrations',
                        onClick: () => p.workspace.setPickedStoreId(String(row.id)),
                      },
                      {
                        key: 'toggle',
                        label: row.active === false ? p.t('stores.activate') : p.t('stores.deactivate'),
                        onClick: () => p.toggleMutation.mutate(row.id),
                      },
                      {
                        key: 'delete',
                        label: p.t('common.delete'),
                        danger: true,
                        onClick: () => p.tryDelete(row),
                      },
                    ]}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}

      <RestaurantStoreFormModal
        open={Boolean(p.modal)}
        mode={p.modal?.mode}
        form={p.modal?.form}
        typeOptions={p.restaurantTypeOptions}
        onChange={(form) => p.setModal((prev) => (prev ? { ...prev, form } : prev))}
        onClose={() => p.setModal(null)}
        onSubmit={p.submit}
        isPending={p.saveMutation.isPending}
        t={p.t}
      />
    </section>
  );
}
