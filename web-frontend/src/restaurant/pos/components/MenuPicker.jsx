import { fmtMoneyCompact } from '../../../utils/formatMoney';
import '../styles/order-workspace.css';

export default function MenuPicker({ items, onAdd, t }) {
  if (!items.length) {
    return <div className="rst-empty">{t('rst.order.emptyMenu')}</div>;
  }

  return (
    <div className="rst-menu-grid">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="rst-menu-card"
          onClick={() => onAdd(item)}
        >
          <span className="rst-menu-card__name">{item.name}</span>
          <span className="rst-menu-card__price">{fmtMoneyCompact(item.price)}</span>
        </button>
      ))}
    </div>
  );
}
