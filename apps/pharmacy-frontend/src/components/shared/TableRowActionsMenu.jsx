import { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

const MENU_WIDTH = 196;
const MENU_ITEM_H = 42;
const GAP = 4;

/**
 * Row kebab menu rendered in a portal so it is not clipped by table overflow.
 * @param {{ open: boolean, onOpenChange: (open: boolean) => void, actions: { label: string, onClick: () => void, danger?: boolean, disabled?: boolean, disabledReason?: string }[] }} props
 */
export default function TableRowActionsMenu({ open, onOpenChange, actions }) {
  const anchorRef = useRef(null);
  const menuRef = useRef(null);
  const positionRef = useRef({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const menuHeight = actions.length * MENU_ITEM_H + 8;
    let top = rect.bottom + GAP;
    if (top + menuHeight > window.innerHeight - 8) {
      top = rect.top - menuHeight - GAP;
    }
    let left = rect.right - MENU_WIDTH;
    left = Math.max(8, Math.min(left, window.innerWidth - MENU_WIDTH - 8));
    positionRef.current = { top, left };
    if (menuRef.current) {
      menuRef.current.style.top = `${top}px`;
      menuRef.current.style.left = `${left}px`;
    }
  }, [open, actions.length]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      const t = e.target;
      if (anchorRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      onOpenChange(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onOpenChange]);

  const menu = open ? (
    <div
      ref={menuRef}
      role="menu"
      style={{
        position: 'fixed',
        top: positionRef.current.top,
        left: positionRef.current.left,
        width: MENU_WIDTH,
        zIndex: 9999,
      }}
      className="ui-popover py-1.5"
    >
      {actions.map((action) => {
        const isDisabled = Boolean(action.disabled);
        const tooltip = action.disabledReason || action.title;
        return (
          <button
            key={action.label}
            type="button"
            role="menuitem"
            disabled={isDisabled}
            title={tooltip}
            onClick={() => {
              if (isDisabled) return;
              action.onClick();
              onOpenChange(false);
            }}
            className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              isDisabled
                ? 'cursor-not-allowed text-ink-disabled'
                : action.danger
                  ? 'text-danger-text hover:bg-danger-soft'
                  : 'text-ink hover:bg-primary-50'
            }`}
          >
            <div className="font-medium leading-snug">{action.label}</div>
            {isDisabled && action.disabledReason ? (
              <div className="mt-0.5 text-xs font-normal leading-tight text-ink-muted">
                {action.disabledReason}
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        aria-label="Amallar menyusi"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => onOpenChange(!open)}
        className="ui-btn-icon h-8 w-8"
      >
        <MoreVertical size={16} strokeWidth={1.75} />
      </button>
      {menu ? (typeof document !== 'undefined' && document.body ? createPortal(menu, document.body) : menu) : null}
    </>
  );
}
