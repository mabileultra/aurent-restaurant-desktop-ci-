import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Copy, Eye, MoreVertical, Trash2 } from 'lucide-react';
import { usePlatformDesktopRowMenuPosition } from './usePlatformDesktopRowMenuPosition';

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
  onExtend,
  onRevoke,
  t,
}) {
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const { position, MENU_WIDTH } = usePlatformDesktopRowMenuPosition({
    isOpen,
    triggerRef,
    menuRef,
    onClose,
  });

  const isExpired = item?.status === 'EXPIRED';

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

      {/* 3. Extend (+24h) */}
      <button
        type="button"
        role="menuitem"
        disabled={isExpired}
        onClick={() => {
          if (isExpired) return;
          onClose();
          onExtend?.(item);
        }}
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium outline-none transition-colors ${
          isExpired
            ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50'
            : 'text-slate-700 hover:bg-slate-100 focus:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:bg-slate-800 cursor-pointer'
        }`}
      >
        <Clock size={14} className="text-slate-400 shrink-0" />
        <span>{t('platform.desktopNotifications.actionExtend24h', { defaultValue: 'Muddatni uzaytirish (+24 soat)' })}</span>
      </button>

      {/* 4. Revoke */}
      <button
        type="button"
        role="menuitem"
        disabled={isExpired}
        onClick={() => {
          if (isExpired) return;
          onClose();
          onRevoke?.(item);
        }}
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium outline-none transition-colors ${
          isExpired
            ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50'
            : 'text-red-600 hover:bg-red-50 focus:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 dark:focus:bg-red-950/40 cursor-pointer'
        }`}
      >
        <Trash2 size={14} className={isExpired ? 'text-slate-400 shrink-0' : 'text-red-500 shrink-0'} />
        <span>{t('platform.desktopNotifications.actionRevoke', { defaultValue: 'Kassalardan olib tashlash' })}</span>
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
