import { createPortal } from 'react-dom';
import '../styles/stock-products-row-menu.css';

export default function StockProductsRowMenu({
  menu,
  t,
  manage,
  onClose,
  onAdjust,
  onReceive,
}) {
  if (!menu) return null;

  return createPortal(
    <>
      <button
        type="button"
        className="rst-stock-row-menu__backdrop"
        aria-label="close menu"
        onClick={onClose}
      />
      <div
        role="menu"
        className="rst-stock-row-menu"
        style={{
          top: `${menu.rect.bottom + 4}px`,
          right: `${window.innerWidth - menu.rect.right}px`,
        }}
      >
        {manage ? (
          <button
            type="button"
            className="rst-stock-row-menu__item"
            onClick={() => {
              onAdjust(menu.product);
              onClose();
            }}
          >
            {t('products.stockBtn')}
          </button>
        ) : null}
        {manage ? (
          <button
            type="button"
            className="rst-stock-row-menu__item"
            onClick={() => {
              onReceive({ id: menu.product.id, name: menu.product.name });
              onClose();
            }}
          >
            {t('products.rowReceive')}
          </button>
        ) : null}
      </div>
    </>,
    document.body,
  );
}
