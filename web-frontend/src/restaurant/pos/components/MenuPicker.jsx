import { useMemo, useState } from 'react';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import '../styles/order-workspace.css';

export default function MenuPicker({ items, onAdd, t, qtyByMenuId = {} }) {
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');

  const categories = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      const name = item.category || t('rst.order.uncategorized');
      map.set(name, (map.get(name) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [items, t]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (category && (item.category || t('rst.order.uncategorized')) !== category) return false;
      if (!q) return true;
      return String(item.name || '').toLowerCase().includes(q);
    });
  }, [items, category, query, t]);

  if (!items.length) {
    return <div className="rst-empty">{t('rst.order.emptyMenu')}</div>;
  }

  return (
    <div className="rst-menu">
      <label className="rst-menu__search">
        <span className="visually-hidden">{t('rst.order.searchMenu')}</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('rst.order.searchMenuPh')}
        />
      </label>

      <div className="rst-menu-cats">
        <button
          type="button"
          className={`rst-menu-cat${!category ? ' is-active' : ''}`}
          onClick={() => setCategory('')}
        >
          {t('rst.order.allCategories')}
          <em>{items.length}</em>
        </button>
        {categories.map(([name, count]) => (
          <button
            key={name}
            type="button"
            className={`rst-menu-cat${category === name ? ' is-active' : ''}`}
            onClick={() => setCategory(name)}
          >
            {name}
            <em>{count}</em>
          </button>
        ))}
      </div>

      <div className="rst-menu-grid">
        {visible.map((item) => {
          const inCheck = qtyByMenuId[item.id] || 0;
          return (
            <button
              key={item.id}
              type="button"
              className={`rst-menu-card${inCheck > 0 ? ' is-in-check' : ''}`}
              onClick={() => onAdd(item)}
            >
              {inCheck > 0 ? (
                <span className="rst-menu-card__badge">{t('rst.order.inCheck', { count: inCheck })}</span>
              ) : null}
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" className="rst-menu-card__img" />
              ) : (
                <span className="rst-menu-card__ph" aria-hidden />
              )}
              <span className="rst-menu-card__name">{item.name}</span>
              <span className="rst-menu-card__footer">
                <span className="rst-menu-card__price">{fmtMoneyCompact(item.price)}</span>
                <span className="rst-menu-card__add" aria-hidden>+</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
