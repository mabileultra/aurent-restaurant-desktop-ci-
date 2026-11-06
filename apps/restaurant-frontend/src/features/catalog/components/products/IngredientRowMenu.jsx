import { createPortal } from 'react-dom';
import '../../styles/ingredient-row-menu.css';

export default function IngredientRowMenu({ menu, t, manage, onClose, onEdit, onDelete }) {
  if (!menu) return null;

  return createPortal(
    <>
      <button type="button" className="rst-ingredient-row-menu__backdrop" aria-label="close" onClick={onClose} />
      <div
        role="menu"
        className="rst-ingredient-row-menu"
        style={{
          top: `${menu.rect.bottom + 4}px`,
          right: `${window.innerWidth - menu.rect.right}px`,
        }}
      >
        {manage ? (
          <button
            type="button"
            className="rst-ingredient-row-menu__item"
            onClick={() => {
              onEdit(menu.product);
              onClose();
            }}
          >
            {t('products.rowEdit')}
          </button>
        ) : null}
        {manage ? (
          <button
            type="button"
            className="rst-ingredient-row-menu__item is-danger"
            onClick={() => {
              onDelete(menu.product);
              onClose();
            }}
          >
            {t('products.rowDelete')}
          </button>
        ) : null}
      </div>
    </>,
    document.body,
  );
}
