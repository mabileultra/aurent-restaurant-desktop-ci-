import { useEffect, useMemo, useRef, useState } from 'react';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import '../styles/order-workspace.css';

const TAG_ORDER = ['HIT', 'SPICY', 'CHEF', 'GRILL', 'FRESH', 'TEA'];

function parseTags(raw) {
  if (!raw) return [];
  const set = new Set(
    String(raw)
      .split(/[,;|\s]+/)
      .map((part) => part.trim().toUpperCase())
      .filter(Boolean),
  );
  return TAG_ORDER.filter((code) => set.has(code)).concat(
    [...set].filter((code) => !TAG_ORDER.includes(code)),
  );
}

export default function MenuPicker({ items, onAdd, t, qtyByMenuId = {} }) {
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const [focusedId, setFocusedId] = useState(null);
  const searchRef = useRef(null);

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
      const hay = `${item.name || ''} ${item.sku || ''} ${item.description || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, category, query, t]);

  useEffect(() => {
    const onKey = (event) => {
      const target = event.target;
      const typing = target
        && (target.tagName === 'INPUT'
          || target.tagName === 'TEXTAREA'
          || target.tagName === 'SELECT'
          || target.isContentEditable);
      if (event.key === '/' && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (event.key === 'Escape' && document.activeElement === searchRef.current) {
        setQuery('');
        searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!items.length) {
    return <div className="rst-empty">{t('rst.order.emptyMenu')}</div>;
  }

  return (
    <div className="rst-menu">
      <label className="rst-menu__search">
        <span className="rst-menu__search-ico" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
        </span>
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('rst.order.searchMenuPh')}
        />
        <span className="rst-menu__search-hint">
          <kbd>/</kbd>
          <em>{t('rst.order.searchEsc')}</em>
        </span>
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
          const focused = focusedId === item.id;
          const tags = parseTags(item.tags);
          const className = [
            'rst-menu-card',
            inCheck > 0 ? 'is-in-check' : '',
            focused ? 'is-focus' : '',
          ].filter(Boolean).join(' ');

          return (
            <button
              key={item.id}
              type="button"
              className={className}
              onClick={() => {
                setFocusedId(item.id);
                onAdd(item);
              }}
            >
              <div className="rst-menu-card__media">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="rst-menu-card__img" />
                ) : (
                  <span className="rst-menu-card__ph" aria-hidden />
                )}
                {item.prepMinutes != null && Number(item.prepMinutes) > 0 ? (
                  <span className="rst-menu-card__prep">~{item.prepMinutes} {t('rst.order.prepMin')}</span>
                ) : null}
                {inCheck > 0 ? (
                  <span className="rst-menu-card__badge">{t('rst.order.inCheck', { count: inCheck })}</span>
                ) : null}
              </div>

              {tags.length ? (
                <div className="rst-menu-card__tags">
                  {tags.map((code) => (
                    <span key={code} className={`rst-menu-tag rst-menu-tag--${code.toLowerCase()}`}>
                      {t(`rst.order.tag.${code}`, { defaultValue: code })}
                    </span>
                  ))}
                </div>
              ) : null}

              <span className="rst-menu-card__name">{item.name}</span>
              {item.description ? (
                <span className="rst-menu-card__desc">{item.description}</span>
              ) : null}
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
