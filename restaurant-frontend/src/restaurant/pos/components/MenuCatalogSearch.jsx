import { createPortal } from 'react-dom';

export default function MenuCatalogSearch({ catalog, t }) {
  const searchPh = catalog.searchSlot
    ? (t('rst.order.searchMenuShortPh', { defaultValue: 'Поиск…' }) || 'Поиск…')
    : t('rst.order.searchMenuPh');

  const search = (
    <label className="rst-menu__search">
      <span className="rst-menu__search-ico" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      </span>
      <input
        ref={catalog.searchRef}
        type="search"
        value={catalog.query}
        onChange={(e) => catalog.setQuery(e.target.value)}
        placeholder={searchPh}
      />
      {catalog.searchSlot ? null : (
        <span className="rst-menu__search-hint">
          <kbd>/</kbd>
          <em>{t('rst.order.searchEsc')}</em>
        </span>
      )}
    </label>
  );

  if (catalog.searchSlot) return createPortal(search, catalog.searchSlot);
  return search;
}
