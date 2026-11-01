import React, { useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, RotateCcw, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { trapFocus } from '../utils/focusTrapUtils';
import { buildCatalogGroups } from '../utils/accessRightsCatalogUtils';
import RoleEmployeeEditGroupList from './RoleEmployeeEditGroupList';
import RoleEmployeeEditHeader from './RoleEmployeeEditHeader';
import RoleEmployeeResetConfirmDialog from './RoleEmployeeResetConfirmDialog';
import RoleEmployeeDiscardConfirmDialog from './RoleEmployeeDiscardConfirmDialog';
import { useRoleEmployeeEdit } from '../hooks/useRoleEmployeeEdit';

export default function RoleEmployeeEditDrawer({
  isOpen,
  onClose,
  user,
  businessType = 'RESTAURANT',
  businessTypeName,
  rawCatalog = [],
  onSaved,
}) {
  const { t } = useTranslation();
  const triggerElementRef = useRef(null);
  const closeButtonRef = useRef(null);
  const drawerRef = useRef(null);

  const effectiveBT = user?.businessType || businessType || 'RESTAURANT';

  const {
    loading,
    saving,
    detail,
    moduleToggles,
    searchQuery,
    setSearchQuery,
    filterMode,
    setFilterMode,
    confirmDiscardOpen,
    setConfirmDiscardOpen,
    confirmResetOpen,
    setConfirmResetOpen,
    handleToggle,
    handleRequestClose,
    handleConfirmDiscard,
    handleSave,
    handleConfirmReset,
    defaultsMap,
  } = useRoleEmployeeEdit({ user, isOpen, onSaved, onClose });

  useEffect(() => {
    if (!isOpen || !user) return undefined;
    triggerElementRef.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => closeButtonRef.current?.focus(), 50);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      triggerElementRef.current?.focus?.();
    };
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (confirmDiscardOpen) setConfirmDiscardOpen(false);
        else if (confirmResetOpen) setConfirmResetOpen(false);
        else handleRequestClose();
      } else if (e.key === 'Tab') {
        e.stopPropagation();
        trapFocus(e, drawerRef.current);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleRequestClose, confirmDiscardOpen, confirmResetOpen]);

  const allowedModuleIds = useMemo(() => {
    if (!detail?.modules) return null;
    return new Set(detail.modules.map((m) => m.id));
  }, [detail]);

  const catalogGroups = useMemo(() => {
    return buildCatalogGroups(rawCatalog, effectiveBT, t, allowedModuleIds);
  }, [rawCatalog, effectiveBT, t, allowedModuleIds]);

  if (!isOpen || !user) return null;

  const drawerNode = (
    <div
      ref={drawerRef}
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[110] flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="employee-edit-title"
    >
      <div className="flex flex-col w-full max-w-xl bg-white h-full shadow-2xl dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        <RoleEmployeeEditHeader
          user={user}
          businessTypeName={businessTypeName}
          detail={detail}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterMode={filterMode}
          setFilterMode={setFilterMode}
          onClose={handleRequestClose}
          closeButtonRef={closeButtonRef}
        />

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-xs text-slate-500 gap-2">
              <Loader2 size={20} className="animate-spin text-emerald-600" />
              <span>Xodim modullari yuklanmoqda...</span>
            </div>
          ) : (
            <RoleEmployeeEditGroupList
              catalogGroups={catalogGroups}
              moduleToggles={moduleToggles}
              defaultsMap={defaultsMap}
              filterMode={filterMode}
              searchQuery={searchQuery}
              onToggle={handleToggle}
            />
          )}
        </div>

        <footer className="border-t border-slate-100 px-6 py-3 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-850 flex items-center justify-between shrink-0">
          <div>
            {detail?.moduleAccessCustom && (
              <button
                type="button"
                disabled={saving}
                onClick={() => setConfirmResetOpen(true)}
                className="inline-flex items-center gap-1 text-xs text-rose-600 hover:underline cursor-pointer disabled:opacity-50"
              >
                <RotateCcw size={12} />
                <span>Shablonga qaytarish</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRequestClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              disabled={saving || loading}
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-60"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              <span>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</span>
            </button>
          </div>
        </footer>

        {confirmResetOpen && (
          <RoleEmployeeResetConfirmDialog
            user={user}
            isResetting={saving}
            onCancel={() => setConfirmResetOpen(false)}
            onConfirm={handleConfirmReset}
          />
        )}

        <RoleEmployeeDiscardConfirmDialog
          isOpen={confirmDiscardOpen}
          onStay={() => setConfirmDiscardOpen(false)}
          onDiscard={handleConfirmDiscard}
        />
      </div>
    </div>
  );

  return typeof document !== 'undefined' && document.body ? createPortal(drawerNode, document.body) : drawerNode;
}
