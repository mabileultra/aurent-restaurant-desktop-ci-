import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import '../../styles/categories-row-menu.css';

export default function CategoryRowMenu({ rowMenu, onClose, onEdit, onDelete }) {
  const { t } = useTranslation();
  if (!rowMenu || typeof document === 'undefined') return null;

  return createPortal(
    <>
      <button
        type="button"
        className="rst-cat-menu__backdrop"
        aria-label="close menu"
        onClick={onClose}
      />
      <div
        role="menu"
        className="rst-cat-menu"
        style={{
          top: `${rowMenu.rect.bottom + 4}px`,
          right: `${window.innerWidth - rowMenu.rect.right}px`,
        }}
      >
        <button type="button" className="rst-cat-menu__item" onClick={() => onEdit(rowMenu.category)}>
          {t('categories.rowEdit')}
        </button>
        <button
          type="button"
          className="rst-cat-menu__item rst-cat-menu__item--danger"
          onClick={() => onDelete(rowMenu.category)}
        >
          {t('categories.rowDelete')}
        </button>
      </div>
    </>,
    document.body,
  );
}
