import { MoreVertical } from 'lucide-react';
import { BaseButton } from '../../../components/ui';
import TablePagination from '../../../components/shared/TablePagination';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import RstMenuImage from '../../shared/components/RstMenuImage';
import { formatMenuPortion } from '../../shared/utils/formatMenuPortion';

function dishTags(item, t) {
  return String(item.tags || '')
    .split(/[,;|\s]+/)
    .map((part) => part.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 4)
    .map((code) => ({
      code,
      label: t(`rst.order.tag.${code}`, { defaultValue: code }),
    }));
}

export default function MenuDishList({ p, onOpenMenu, onEditDish, photosEnabled = true }) {
  return (
    <div className="rst-menu-board">
      <div className="rst-menu-board__head">
        <strong>{p.t('rst.admin.menuList')}</strong>
        <div className="rst-menu-board__head-actions">
          <span>{p.total}</span>
          <BaseButton
            type="button"
            variant="secondary"
            className="rst-menu-board__btn-light"
            onClick={p.exportDishes}
            disabled={p.exportBusy}
          >
            {p.t('rst.admin.menuExport')}
          </BaseButton>
          <BaseButton
            type="button"
            variant="secondary"
            className="rst-menu-board__btn-light"
            onClick={p.openImport}
          >
            {p.t('rst.admin.menuImport')}
          </BaseButton>
          <BaseButton type="button" onClick={p.openComposer}>
            {p.t('rst.admin.addDish')}
          </BaseButton>
        </div>
      </div>

      {p.isLoading ? (
        <div className="rst-menu-board__empty">{p.t('common.loading')}</div>
      ) : p.total === 0 ? (
        <div className="rst-menu-board__empty">{p.t('rst.admin.menuEmpty')}</div>
      ) : (
        <div className="rst-menu-board__grid">
          {p.rows.map((item) => {
            const station = p.stationName(item.stationId);
            const portion = formatMenuPortion(item);
            const metaParts = [
              item.category || null,
              portion || null,
              station || null,
              item.sku || null,
            ].filter(Boolean);
            const tags = dishTags(item, p.t);

            return (
              <article
                key={item.id}
                className={`rst-menu-card${!item.available ? ' is-off' : ''}${onEditDish ? ' is-clickable' : ''}`}
                role={onEditDish ? 'button' : undefined}
                tabIndex={onEditDish ? 0 : undefined}
                onClick={onEditDish ? () => onEditDish(item) : undefined}
                onKeyDown={onEditDish ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onEditDish(item);
                  }
                } : undefined}
              >
                {photosEnabled ? (
                  <div className="rst-menu-card__media">
                    {item.imageUrl ? (
                      <RstMenuImage imageUrl={item.imageUrl} />
                    ) : (
                      <div className="rst-menu-card__media-empty">{p.t('rst.admin.noPhoto')}</div>
                    )}
                    {!item.available ? (
                      <span className="rst-menu-card__badge is-off">{p.t('rst.admin.unavailable')}</span>
                    ) : null}
                    {item.prepMinutes != null && Number(item.prepMinutes) > 0 ? (
                      <span className="rst-menu-card__prep">~{item.prepMinutes} {p.t('rst.order.prepMin')}</span>
                    ) : null}
                    <button
                      type="button"
                      className="rst-menu-card__more"
                      aria-label={p.t('common.actions')}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenMenu(item, e.currentTarget.getBoundingClientRect());
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="rst-menu-card__bar">
                    {!item.available ? (
                      <span className="rst-menu-card__badge is-off">{p.t('rst.admin.unavailable')}</span>
                    ) : null}
                    {item.prepMinutes != null && Number(item.prepMinutes) > 0 ? (
                      <span className="rst-menu-card__prep">~{item.prepMinutes} {p.t('rst.order.prepMin')}</span>
                    ) : null}
                    <button
                      type="button"
                      className="rst-menu-card__more"
                      aria-label={p.t('common.actions')}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenMenu(item, e.currentTarget.getBoundingClientRect());
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                )}
                <div className="rst-menu-card__body">
                  {tags.length ? (
                    <div className="rst-menu-card__tags">
                      {tags.map((tag) => (
                        <span key={tag.code} className={`rst-menu-card__tag rst-menu-card__tag--${tag.code.toLowerCase()}`}>
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <h3 className="rst-menu-card__title">{item.name}</h3>
                  {item.description ? (
                    <p className="rst-menu-card__desc">{item.description}</p>
                  ) : null}
                  <p className="rst-menu-card__meta">
                    {metaParts.length ? metaParts.join(' · ') : p.t('rst.admin.noStation')}
                  </p>
                  {item._familySizeCount > 1 ? (
                    <>
                      <p className="rst-menu-card__meta">
                        {p.t('rst.order.variantSizes', { count: item._familySizeCount })}
                        {' · '}
                        {p.t('rst.order.priceFrom', { price: fmtMoneyCompact(item._familyMinPrice) })}
                      </p>
                      <ul className="rst-menu-card__sizes">
                        {(item._familyVariants || []).map((size) => {
                          const portion = formatMenuPortion(size) || '—';
                          return (
                            <li key={size.id}>
                              <button
                                type="button"
                                className="rst-menu-card__size-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  p.openVariantForm(item, size);
                                }}
                              >
                                <span className="rst-menu-card__size-portion">{portion}</span>
                                <span className="rst-menu-card__size-price">{fmtMoneyCompact(size.price)}</span>
                                {size.sku ? (
                                  <span className="rst-menu-card__size-sku">{size.sku}</span>
                                ) : null}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  ) : (
                    <p className="rst-menu-card__price">{fmtMoneyCompact(item.price)}</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {p.total > 0 ? (
        <TablePagination
          className="rst-data-card__pagination rst-menu-board__pagination"
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
  );
}
