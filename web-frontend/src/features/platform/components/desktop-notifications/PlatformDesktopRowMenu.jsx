import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Eye, MoreVertical, Trash2 } from 'lucide-react';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const MENU_WIDTH = 200;
const MENU_HEIGHT = 126;
const GAP = 4;

/**
 * Accessible table row action menu rendered via portal to prevent table overflow clipping.
 */
export default function PlatformDesktopRowMenu({
  item,
  isOpen,
  onToggle,
  onClose,
  onViewDetails,
  onDuplicate,
  t,
}) {
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Calculate portal position relative to trigger button
  useIsomorphicLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    let top = rect.bottom + GAP;
    if (top + MENU_HEIGHT > window.innerHeight - 8) {
      top = Math.max(8, rect.top - MENU_HEIGHT - GAP);
    }

    let left = rect.right - MENU_WIDTH;
    if (left < 8) {
      left = 8;
    } else if (left + MENU_WIDTH > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - MENU_WIDTH - 8);
    }

    setPosition({ top, left });
  }, [isOpen]);

  // Focus the first interactive item when opened
  useIsomorphicLayoutEffect(() => {
    if (isOpen && menuRef.current) {
      const firstInteractive = menuRef.current.querySelector('button:not(:disabled)');
      firstInteractive?.focus();
    }
  }, [isOpen]);

  // Handle outside click, escape, and window scroll
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e) => {
      const target = e.target;
      if (
        (menuRef.current && menuRef.current.contains(target)) ||
        (triggerRef.current && triggerRef.current.contains(target))
      ) {
        return;
      }
      onClose();
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        triggerRef.current?.focus();
        return;
      }

      if (e.key === 'Tab') {
        onClose();
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!menuRef.current) return;
        const buttons = Array.from(menuRef.current.querySelectorAll('button:not(:disabled)'));
        if (!buttons.length) return;
        const currentIndex = buttons.indexOf(document.activeElement);
        let nextIndex;
        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex >= 0 && currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
        }
        buttons[nextIndex]?.focus();
      }
    };

    const handleScrollOrResize = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      onClose();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, onClose]);

  const menuNode = isOpen ? (
    <div
      ref={menuRef}
      role="menu"
      aria-orientation="vertical"
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        width: MENU_WIDTH,
        zIndex: 99999,
      }}
      className="rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-750 dark:bg-slate-850 text-left animate-in fade-in zoom-in-95 duration-100"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. View Details */}
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onClose();
          onViewDetails(item);
        }}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:bg-slate-800 outline-none transition-colors cursor-pointer"
      >
        <Eye size={14} className="text-slate-400 shrink-0" />
        <span>{t('platform.desktopNotifications.drawerTitle')}</span>
      </button>

      {/* 2. Duplicate */}
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onClose();
          onDuplicate(item);
        }}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:bg-slate-800 outline-none transition-colors cursor-pointer"
      >
        <Copy size={14} className="text-slate-400 shrink-0" />
        <span>{t('platform.desktopNotifications.actionDuplicate')}</span>
      </button>

      {/* 3. Revoke (Coming soon disabled) */}
      <button
        type="button"
        role="menuitem"
        disabled
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-400 opacity-60 cursor-not-allowed select-none"
        title={t('platform.desktopNotifications.comingSoon', { defaultValue: 'Tez kunda' })}
      >
        <div className="flex items-center gap-2">
          <Trash2 size={14} className="shrink-0" />
          <span>{t('platform.desktopNotifications.actionRevoke')}</span>
        </div>
        <span className="rounded bg-slate-100 dark:bg-slate-750 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          {t('platform.desktopNotifications.comingSoon', { defaultValue: 'Tez kunda' })}
        </span>
      </button>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        aria-label={t('common.actions', { defaultValue: 'Amallar' })}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <MoreVertical size={16} />
      </button>
      {menuNode
        ? typeof document !== 'undefined' && document.body
          ? createPortal(menuNode, document.body)
          : menuNode
        : null}
    </>
  );
}
