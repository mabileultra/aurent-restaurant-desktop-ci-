import React, { useEffect, useRef, useState } from 'react';
import { Eye, MoreVertical, Pencil, Power, Trash2 } from 'lucide-react';
import Button from '../../../components/aa/Button';

/**
 * CompanyRowActionsMenu — Jadval qatoridagi 32px amallar menyusi.
 * WCAG AA va klaviatura yordamida boshqarish: Esc yopadi, fokus triggerga qaytadi.
 */
export default function CompanyRowActionsMenu({
  company,
  open = false,
  onOpenChange,
  onSelectCompany,
  onEdit,
  onToggleActive,
  onDelete,
}) {
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const handleToggle = (e) => {
    e.stopPropagation();
    onOpenChange?.(!open);
  };

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onOpenChange?.(false);
        triggerRef.current?.focus();
      }
    };

    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        onOpenChange?.(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside);

    // Birinchi bandga fokus berish
    const firstItem = menuRef.current?.querySelector('button[role="menuitem"]');
    firstItem?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [open, onOpenChange]);

  const handleAction = (actionFn) => (e) => {
    e.stopPropagation();
    onOpenChange?.(false);
    actionFn?.(company);
  };

  const companyName = company?.name || 'Kompaniya';

  return (
    <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <Button
        ref={triggerRef}
        variant="ghost"
        size="sm"
        iconOnly
        icon={<MoreVertical size={16} aria-hidden="true" />}
        aria-label={`${companyName} — amallar`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleToggle}
        className="h-8 w-8 !p-0"
      />

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={`${companyName} amallari`}
          className="absolute right-0 top-full mt-1 w-[232px] bg-aa-surface border border-aa-line rounded-aa-md shadow-pop p-1 z-30 animate-fade-in"
        >
          {/* 1. Tezkor ko‘rish */}
          <button
            type="button"
            role="menuitem"
            onClick={handleAction(onSelectCompany)}
            className="w-full h-9 px-3 flex items-center gap-2 text-sm rounded-aa-sm hover:bg-aa-surface-hover text-aa-ink text-left transition-colors cursor-pointer"
          >
            <Eye size={16} className="text-aa-ink-muted" aria-hidden="true" />
            <span>Tezkor ko‘rish</span>
          </button>

          {/* 2. Tahrirlash */}
          <button
            type="button"
            role="menuitem"
            onClick={handleAction(onEdit)}
            className="w-full h-9 px-3 flex items-center gap-2 text-sm rounded-aa-sm hover:bg-aa-surface-hover text-aa-ink text-left transition-colors cursor-pointer"
          >
            <Pencil size={16} className="text-aa-ink-muted" aria-hidden="true" />
            <span>Tahrirlash</span>
          </button>

          {/* 3. Faolsizlantirish / Faollashtirish */}
          <button
            type="button"
            role="menuitem"
            onClick={handleAction(onToggleActive)}
            className="w-full h-9 px-3 flex items-center gap-2 text-sm rounded-aa-sm hover:bg-aa-surface-hover text-aa-ink text-left transition-colors cursor-pointer"
          >
            <Power size={16} className="text-aa-ink-muted" aria-hidden="true" />
            <span>{company.active ? 'Faolsizlantirish' : 'Faollashtirish'}</span>
          </button>

          {/* Ajratgich */}
          <div className="h-px bg-aa-line my-1" role="separator" />

          {/* 4. O‘chirish */}
          <button
            type="button"
            role="menuitem"
            onClick={handleAction(onDelete)}
            className="w-full h-9 px-3 flex items-center gap-2 text-sm rounded-aa-sm hover:bg-aa-danger-soft text-aa-danger text-left transition-colors cursor-pointer"
          >
            <Trash2 size={16} aria-hidden="true" />
            <span>O‘chirish</span>
          </button>
        </div>
      )}
    </div>
  );
}
