import { MoreVertical } from 'lucide-react';
import { BaseButton } from '../../../components/ui';
import { fmtMoneyCompact } from '../../../utils/formatMoney';

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

export default function MenuDishList({ p, onOpenMenu }) {
  return (
    <div className="rst-menu-board">
      <div className="rst-menu-board__head">
        <strong>{p.t('rst.admin.menuList')}</strong>
        <div className="rst-menu-board__head-actions">
          <span>{p.filteredItems.length}</span>
          <BaseButton type="button" onClick={p.openComposer}>
            {p.t('rst.admin.addDish')}
          </BaseButton>
        </div>
      </div>

      {p.isLoading ? (
        <div className="rst-menu-board__empty">{p.t('common.loading')}</div>
      ) : p.filteredItems.length === 0 ? (
        <div className="rst-menu-board__empty">{p.t('rst.admin.menuEmpty')}</div>
      ) : (
        <div className="rst-menu-board__grid">
          {p.filteredItems.map((item) => {
            const station = p.stationName(item.stationId);
            const metaParts = [item.category || null, station || null, item.sku || null].filter(Boolean);
            const tags = dishTags(item, p.t);

            return (
              <article key={item.id} className={`rst-menu-card${!item.available ? ' is-off' : ''}`}>
                <div className="rst-menu-card__media">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" />
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
                  <p className="rst-menu-card__price">{fmtMoneyCompact(item.price)}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
