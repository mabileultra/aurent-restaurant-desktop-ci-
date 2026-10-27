import RstMenuImage from '../../shared/components/RstMenuImage';
import '../styles/menu-catalog-board.css';

export default function MenuCategoryPanel({ catalog, t }) {
  const cardCount = 1 + (catalog.tiles?.length || 0);
  const density = cardCount <= 2 ? 'is-few' : cardCount <= 4 ? 'is-mid' : 'is-many';

  return (
    <section className={`rst-menu-cats-board ${density}`}>
      <button
        type="button"
        className={`rst-menu-cat-card${!catalog.category ? ' is-active' : ''}`}
        onClick={() => catalog.setCategory('')}
      >
        <div className="rst-menu-cat-card__media rst-menu-cat-card__media--all" />
        <div className="rst-menu-cat-card__meta">
          <strong>{t('rst.order.allCategories')}</strong>
          <span>{t('rst.order.dishCount', { count: catalog.totalFamilies })}</span>
        </div>
      </button>

      {catalog.tiles.map((tile) => (
        <button
          key={tile.key}
          type="button"
          className={`rst-menu-cat-card${catalog.category === tile.name ? ' is-active' : ''}`}
          onClick={() => catalog.setCategory(
            catalog.category === tile.name ? '' : tile.name,
          )}
        >
          <div className="rst-menu-cat-card__media">
            {tile.imageUrl ? (
              <RstMenuImage imageUrl={tile.imageUrl} />
            ) : (
              <i className="rst-menu-cat-card__placeholder" />
            )}
          </div>
          <div className="rst-menu-cat-card__meta">
            <strong>{tile.name}</strong>
            <span>{t('rst.order.dishCount', { count: tile.count })}</span>
          </div>
        </button>
      ))}
    </section>
  );
}
