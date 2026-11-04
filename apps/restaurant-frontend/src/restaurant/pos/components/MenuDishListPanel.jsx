import { fmtMoneyCompact } from '../../../utils/formatMoney';
import RstMenuImage from '../../shared/components/RstMenuImage';
import { useMenuPhotos } from '../../shared/hooks/useMenuPhotos';
import { formatMenuPortion } from '../../shared/utils/formatMenuPortion';
import {
  MENU_LIST_FILTERS,
  familyCategoryName,
  familyImageUrl,
  familyInCheck,
} from '../utils/menuCatalogFilters';
import '../styles/menu-catalog-board.css';

const FILTER_LABEL = {
  all: 'rst.order.filterAll',
  favorites: 'rst.order.filterFavorites',
  recent: 'rst.order.filterRecent',
  discounts: 'rst.order.filterDiscounts',
};

export default function MenuDishListPanel({
  catalog,
  qtyByMenuId = {},
  onAdd,
  onComposeFamily,
  t,
}) {
  const photos = useMenuPhotos(catalog.storeId);
  const uncategorized = t('rst.order.uncategorized');

  return (
    <section className="rst-menu-list">
      <div className="rst-menu-list__head">
        <div className="rst-menu-list__title">
          <strong>{t('rst.order.allDishes')}</strong>
          <em>{catalog.totalFamilies}</em>
        </div>
        <div className="rst-menu-list__filters" role="tablist">
          {MENU_LIST_FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={catalog.listFilter === key}
              className={`rst-menu-list__filter${catalog.listFilter === key ? ' is-active' : ''}`}
              onClick={() => catalog.setListFilter(key)}
            >
              {t(FILTER_LABEL[key])}
            </button>
          ))}
        </div>
      </div>

      <div className="rst-menu-list__rows">
        {catalog.families.length === 0 ? (
          <div className="rst-menu-list__empty">{t('rst.order.emptyMenu')}</div>
        ) : catalog.families.map((family) => {
          const item = family.primary;
          const imageUrl = familyImageUrl(family);
          const inCheck = familyInCheck(family, qtyByMenuId);
          const portion = family.multi
            ? t('rst.order.variantSizes', { count: family.variants.length })
            : formatMenuPortion(item);
          const priceLabel = family.multi && family.minPrice !== family.maxPrice
            ? t('rst.order.priceFrom', { price: fmtMoneyCompact(family.minPrice) })
            : fmtMoneyCompact(item.price);
          const categoryName = familyCategoryName(family, uncategorized);

          const favorite = catalog.favoriteKeys?.has(String(family.key));

          return (
            <div
              key={family.key}
              className={`rst-menu-row${inCheck > 0 ? ' is-in-check' : ''}${favorite ? ' is-favorite' : ''}`}
            >
              <button
                type="button"
                className="rst-menu-row__main"
                onClick={() => catalog.pickFamily(family, { onComposeFamily, onAdd })}
              >
                {photos.enabled ? (
                  <span className="rst-menu-row__thumb">
                    {imageUrl ? <RstMenuImage imageUrl={imageUrl} /> : <i />}
                  </span>
                ) : null}
                <span className="rst-menu-row__body">
                  <strong>{item.name}</strong>
                  <em>{[categoryName, portion].filter(Boolean).join(' · ')}</em>
                  <b>{priceLabel}</b>
                </span>
                <span className="rst-menu-row__add" aria-hidden>+</span>
              </button>
              <button
                type="button"
                className={`rst-menu-row__fav${favorite ? ' is-on' : ''}`}
                title={favorite ? t('rst.order.favoriteRemove') : t('rst.order.favoriteAdd')}
                aria-label={favorite ? t('rst.order.favoriteRemove') : t('rst.order.favoriteAdd')}
                aria-pressed={favorite}
                onClick={(e) => {
                  e.stopPropagation();
                  catalog.toggleFavorite?.(family.key);
                }}
              >
                ★
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
