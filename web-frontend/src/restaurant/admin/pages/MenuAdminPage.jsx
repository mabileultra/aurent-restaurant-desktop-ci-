import { Link } from 'react-router-dom';
import { BaseButton, BaseInput } from '../../../components/ui';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { useInfiniteScrollSlice } from '../../shared/hooks/useInfiniteScrollSlice';
import { MENU_CARD_PAGE_SIZE, useMenuAdminPage } from '../hooks/useMenuAdminPage';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/stations-admin.css';
import '../styles/menu-admin.css';

export default function MenuAdminPage() {
  const p = useMenuAdminPage();
  const {
    visibleItems,
    hasMore,
    visibleCount,
    totalCount,
    rootRef,
    sentinelRef,
  } = useInfiniteScrollSlice(p.filteredItems, {
    pageSize: MENU_CARD_PAGE_SIZE,
    resetKey: p.filterKey,
    rootMargin: '160px',
  });

  if (p.workspace.noAssignment) {
    return <div className="rst-notice">{p.t('rst.floor.noStore')}</div>;
  }

  return (
    <section className="rst-menu">
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{p.t('rst.admin.menuTitle')}</h1>
          <p className="rst-coming__text mb-0">{p.t('rst.admin.menuSubtitle')}</p>
        </div>
        <Link className="rst-shell__footer-link" to="/rst/admin/recipes">{p.t('rst.admin.toRecipes')}</Link>
      </div>

      {p.workspace.canPickStore ? (
        <label className="rst-admin-field rst-admin-field--full mb-3">
          <span className="rst-admin-field__label">{p.t('rst.admin.selectStore')}</span>
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

      <div className="rst-admin-filters">
        <label className="rst-admin-field">
          <span className="rst-admin-field__label">{p.t('common.search')}</span>
          <BaseInput
            value={p.filters.search}
            placeholder={p.t('rst.admin.menuSearchPh')}
            onChange={(e) => p.setFilters({ ...p.filters, search: e.target.value })}
          />
        </label>
        <label className="rst-admin-field">
          <span className="rst-admin-field__label">{p.t('rst.admin.dishCategory')}</span>
          <select
            className="form-select"
            value={p.filters.category}
            onChange={(e) => p.setFilters({ ...p.filters, category: e.target.value })}
          >
            <option value="">{p.t('rst.admin.filterAllCategories')}</option>
            {p.categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>
        <label className="rst-admin-field">
          <span className="rst-admin-field__label">{p.t('rst.admin.station')}</span>
          <select
            className="form-select"
            value={p.filters.stationId}
            onChange={(e) => p.setFilters({ ...p.filters, stationId: e.target.value })}
          >
            <option value="">{p.t('rst.admin.filterAllStations')}</option>
            {p.stations.map((station) => (
              <option key={station.id} value={station.id}>{station.name}</option>
            ))}
          </select>
        </label>
        <label className="rst-admin-field">
          <span className="rst-admin-field__label">{p.t('rst.admin.filterAvailability')}</span>
          <select
            className="form-select"
            value={p.filters.availability}
            onChange={(e) => p.setFilters({ ...p.filters, availability: e.target.value })}
          >
            <option value="all">{p.t('rst.admin.filterAll')}</option>
            <option value="available">{p.t('rst.admin.filterAvailable')}</option>
            <option value="unavailable">{p.t('rst.admin.filterUnavailable')}</option>
          </select>
        </label>
        <BaseButton type="button" variant="ghost" className="rst-admin-filters__reset" onClick={p.resetFilters}>
          {p.t('rst.admin.filterReset')}
        </BaseButton>
      </div>

      <form
        className="rst-admin-form"
        onSubmit={(e) => {
          e.preventDefault();
          p.saveMutation.mutate();
        }}
      >
        <div className="rst-admin-form__grid rst-admin-form__grid--menu">
          <label className="rst-admin-field">
            <span className="rst-admin-field__label">{p.t('rst.admin.dishName')}</span>
            <BaseInput
              value={p.form.name}
              onChange={(e) => p.setForm({ ...p.form, name: e.target.value })}
              required
            />
          </label>
          <label className="rst-admin-field">
            <span className="rst-admin-field__label">{p.t('rst.admin.dishCategory')}</span>
            <BaseInput
              value={p.form.category}
              placeholder={p.t('rst.admin.dishCategoryHint')}
              onChange={(e) => p.setForm({ ...p.form, category: e.target.value })}
            />
          </label>
          <label className="rst-admin-field">
            <span className="rst-admin-field__label">{p.t('rst.admin.sku')}</span>
            <BaseInput value={p.form.sku} onChange={(e) => p.setForm({ ...p.form, sku: e.target.value })} />
          </label>
          <label className="rst-admin-field">
            <span className="rst-admin-field__label">{p.t('rst.admin.price')}</span>
            <BaseInput
              type="number"
              min={0}
              step="0.01"
              value={p.form.price}
              onChange={(e) => p.setForm({ ...p.form, price: e.target.value })}
              required
            />
          </label>
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
        </div>

        <div className="rst-admin-form__grid rst-admin-form__grid--menu-extra">
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

        <div className="rst-admin-form__actions">
          <BaseButton type="submit" disabled={p.saveMutation.isPending}>
            {p.editingId ? p.t('common.save') : p.t('rst.admin.addDish')}
          </BaseButton>
          {p.editingId ? (
            <BaseButton type="button" variant="ghost" onClick={p.resetForm}>
              {p.t('common.cancel')}
            </BaseButton>
          ) : null}
        </div>
      </form>

      <div className="rst-menu-board">
        <div className="rst-menu-board__head">
          <strong>{p.t('rst.admin.menuList')}</strong>
          <span>
            {totalCount === 0
              ? '0'
              : hasMore
                ? `${visibleCount} / ${totalCount}`
                : String(totalCount)}
          </span>
        </div>

        <div ref={rootRef} className="rst-menu-board__scroll">
          {p.isLoading ? (
            <div className="rst-menu-board__empty">{p.t('common.loading')}</div>
          ) : visibleItems.length === 0 ? (
            <div className="rst-menu-board__empty">{p.t('rst.admin.menuEmpty')}</div>
          ) : (
            <div className="rst-menu-board__grid">
              {visibleItems.map((item) => {
                const station = p.stationName(item.stationId);
                const metaParts = [
                  item.category || null,
                  station || null,
                  item.sku || null,
                ].filter(Boolean);

                return (
                  <article key={item.id} className="rst-menu-card">
                    <div className="rst-menu-card__media">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" />
                      ) : (
                        <div className="rst-menu-card__media-empty">{p.t('rst.admin.noPhoto')}</div>
                      )}
                      {!item.available ? (
                        <span className="rst-menu-card__badge is-off">{p.t('rst.admin.unavailable')}</span>
                      ) : null}
                    </div>
                    <div className="rst-menu-card__body">
                      <h3 className="rst-menu-card__title">{item.name}</h3>
                      <p className="rst-menu-card__meta">
                        {metaParts.length ? metaParts.join(' · ') : p.t('rst.admin.noStation')}
                      </p>
                      <div className="rst-menu-card__footer">
                        <p className="rst-menu-card__price">{fmtMoneyCompact(item.price)}</p>
                        <div className="rst-menu-card__actions">
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
                    </div>
                  </article>
                );
              })}
              {hasMore ? (
                <div ref={sentinelRef} className="rst-menu-board__sentinel">
                  {p.t('rst.admin.loadingMore')}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
