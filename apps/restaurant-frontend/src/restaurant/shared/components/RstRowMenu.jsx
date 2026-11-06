import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import '../styles/rst-row-menu.css';

/**
 * Shared overflow menu (⋯).
 * @param {{ top:number, right:number, bottom:number, left:number }|null} rect
 * @param {{ key:string, label:string, onClick?:Function, to?:string, danger?:boolean }[]} items
 */
export default function RstRowMenu({ rect, items, onClose, t }) {
  useEffect(() => {
    if (!rect) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rect, onClose]);

  if (!rect || !items?.length) return null;

  return createPortal(
    <>
      <button
        type="button"
        className="rst-row-menu__backdrop"
        aria-label={t('common.close')}
        onClick={onClose}
      />
      <div
        role="menu"
        className="rst-row-menu"
        style={{
          top: `${rect.bottom + 4}px`,
          right: `${Math.max(8, window.innerWidth - rect.right)}px`,
        }}
      >
        {items.map((item) => {
          if (item.to) {
            return (
              <Link
                key={item.key}
                role="menuitem"
                to={item.to}
                className={item.danger ? 'is-danger' : undefined}
                onClick={() => {
                  onClose();
                  item.onClick?.();
                }}
              >
                {item.label}
              </Link>
            );
          }
          return (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              className={item.danger ? 'is-danger' : undefined}
              onClick={() => {
                onClose();
                item.onClick?.();
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </>,
    document.body,
  );
}
