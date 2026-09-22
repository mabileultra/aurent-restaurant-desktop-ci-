import { Loader, Search } from 'lucide-react';
import '../../styles/ingredient-catalog-search.css';

export default function IngredientCatalogSearch({
  t,
  query,
  onQueryChange,
  loading,
  results,
  onPick,
  canSearch,
}) {
  return (
    <section className="rst-ing-catalog-search">
      <p className="rst-ing-catalog-search__title">{t('rst.nomenclature.catalogSearchTitle')}</p>
      <div className="rst-ing-catalog-search__row">
        <Search size={16} className="rst-ing-catalog-search__icon" aria-hidden />
        <input
          className="rst-ing-catalog-search__input"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t('rst.nomenclature.catalogSearchPh')}
        />
        {loading ? <Loader size={16} className="animate-spin" aria-hidden /> : null}
      </div>
      <p className="rst-ing-catalog-search__hint">{t('rst.nomenclature.catalogSearchHint')}</p>

      {canSearch && results.length === 0 && !loading ? (
        <p className="rst-ing-catalog-search__empty">{t('rst.nomenclature.catalogSearchEmpty')}</p>
      ) : null}

      {results.length > 0 ? (
        <div className="rst-ing-catalog-search__results">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              className="rst-ing-catalog-search__item"
              onClick={() => onPick(p)}
            >
              <span className="rst-ing-catalog-search__name">{p.name}</span>
              <span className="rst-ing-catalog-search__meta">
                {[p.sku, p.barcode, p.categoryName].filter(Boolean).join(' · ')}
                {p.stockQuantity != null ? ` · ${p.stockQuantity}` : ''}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
