import { useState } from 'react';
import { ChevronDown, Loader, Search, X } from 'lucide-react';
import '../../styles/ingredient-tasnif-search.css';

export default function IngredientTasnifSearch({
  t,
  query,
  onQueryChange,
  onSearch,
  loading,
  results,
  error,
  onPick,
  packageItem,
  lang,
  onPackageSelect,
  onPackageClose,
  initialOpen = false,
}) {
  const [open, setOpen] = useState(initialOpen);

  return (
    <section className="rst-ing-tasnif">
      <button
        type="button"
        className="rst-ing-tasnif__toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{t('rst.nomenclature.tasnifOptionalTitle')}</span>
        <ChevronDown size={16} className={open ? 'is-open' : undefined} aria-hidden />
      </button>

      {open ? (
        <>
          <p className="rst-ing-tasnif__hint">{t('rst.nomenclature.tasnifOptionalHint')}</p>
          <div className="rst-ing-tasnif__row">
            <input
              className="rst-ing-tasnif__input"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSearch();
                }
              }}
              placeholder={t('productCatalog.tasnifSearchPh')}
              disabled={loading}
            />
            <button type="button" className="rst-ing-tasnif__btn" onClick={onSearch} disabled={loading}>
              {loading ? <Loader size={16} className="animate-spin" /> : <Search size={16} />}
              <span>{t('productCatalog.tasnifSearchBtn')}</span>
            </button>
          </div>

          {error ? <p className="rst-ing-tasnif__error">{error}</p> : null}

          {results.length > 0 ? (
            <div className="rst-ing-tasnif__results">
              {results.map((item) => (
                <button
                  key={item.mxik}
                  type="button"
                  className="rst-ing-tasnif__item"
                  onClick={() => onPick(item)}
                >
                  <span className="rst-ing-tasnif__item-name">{item.name}</span>
                  <span className="rst-ing-tasnif__item-meta">
                    {t('productCatalog.ikpu')}: {item.mxik}
                    {item.barcode || item.internalCode
                      ? ` · ${t('productModal.barcode')}: ${item.barcode || item.internalCode}`
                      : ''}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </>
      ) : null}

      {packageItem ? (
        <div className="rst-ing-tasnif-pkg">
          <button type="button" className="rst-ing-tasnif-pkg__backdrop" onClick={onPackageClose} aria-label="Close" />
          <div className="rst-ing-tasnif-pkg__panel" role="dialog" aria-modal="true">
            <div className="rst-ing-tasnif-pkg__head">
              <h3>{t('productCatalog.selectPackage')}</h3>
              <button type="button" onClick={onPackageClose} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <p className="rst-ing-tasnif-pkg__name">{packageItem.name}</p>
            <div className="rst-ing-tasnif-pkg__list">
              {(packageItem.packages ?? []).map((pkg) => {
                const unit = lang === 'ru'
                  ? pkg.nameRu || pkg.nameUz || pkg.nameLat
                  : pkg.nameUz || pkg.nameRu || pkg.nameLat;
                return (
                  <button
                    key={pkg.code}
                    type="button"
                    className="rst-ing-tasnif-pkg__option"
                    onClick={() => onPackageSelect(pkg)}
                  >
                    <strong>{pkg.code}</strong>
                    <span>{unit || '—'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
