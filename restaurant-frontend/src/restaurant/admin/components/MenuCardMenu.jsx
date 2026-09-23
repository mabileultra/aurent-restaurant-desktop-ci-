import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';

export default function MenuCardMenu({ menu, onClose, onEdit, onDelete, t }) {
  useEffect(() => {
    if (!menu) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menu, onClose]);

  if (!menu) return null;

  return createPortal(
    <>
      <button
        type="button"
        className="rst-menu-card-menu__backdrop"
        aria-label={t('common.close')}
        onClick={onClose}
      />
      <div
        role="menu"
        className="rst-menu-card-menu"
        style={{
          top: `${menu.rect.bottom + 4}px`,
          right: `${Math.max(8, window.innerWidth - menu.rect.right)}px`,
        }}
      >
        <button type="button" role="menuitem" onClick={() => onEdit(menu.item)}>
          {t('common.edit')}
        </button>
        <Link
          role="menuitem"
          to={`/rst/admin/recipes?dish=${menu.item.id}`}
          onClick={onClose}
        >
          {t('rst.admin.toRecipe')}
        </Link>
        <button
          type="button"
          role="menuitem"
          className="is-danger"
          onClick={() => onDelete(menu.item)}
        >
          {t('common.delete')}
        </button>
      </div>
    </>,
    document.body
  );
}
