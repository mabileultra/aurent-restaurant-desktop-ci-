import { useMemo, useState } from 'react';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import '../styles/order-workspace.css';

export default function MenuPicker({ items, onAdd, t }) {
  const [category, setCategory] = useState('');

  const categories = useMemo(() => {
    const set = new Set();
    items.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const visible = category
    ? items.filter((item) => item.category === category)
    : items;

  if (!items.length) {
    return <div className="rst-empty">{t('rst.order.emptyMenu')}</div>;
  }

  return (
    <div className="rst-menu">
      {categories.length > 0 ? (
        <div className="rst-menu-cats">
          <button
            type="button"
            className={`rst-menu-cat${!category ? ' is-active' : ''}`}
            onClick={() => setCategory('')}
          >
            {t('rst.order.allCategories')}
          </button>
          {categories.map((name) => (
            <button
              key={name}
              type="button"
              className={`rst-menu-cat${category === name ? ' is-active' : ''}`}
              onClick={() => setCategory(name)}
            >
              {name}
            </button>
          ))}
        </div>
      ) : null}
      <div className="rst-menu-grid">
        {visible.map((item) => (
          <button
            key={item.id}
            type="button"
            className="rst-menu-card"
            onClick={() => onAdd(item)}
          >
            {item.imageUrl ? (
              <img src={item.imageUrl} alt="" className="rst-menu-card__img" />
            ) : (
              <span className="rst-menu-card__ph" aria-hidden />
            )}
            <span className="rst-menu-card__name">{item.name}</span>
            <span className="rst-menu-card__price">{fmtMoneyCompact(item.price)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
