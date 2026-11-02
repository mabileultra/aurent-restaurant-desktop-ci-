import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { platformModuleAccessApi } from '../../../../../api';
import { trapFocus } from '../utils/focusTrapUtils';
import { buildCatalogGroups } from '../utils/accessRightsCatalogUtils';
import RoleEmployeeEditGroupList from './RoleEmployeeEditGroupList';
import RoleEmployeeBulkHeader from './RoleEmployeeBulkHeader';
import RoleEmployeeDiscardConfirmDialog from './RoleEmployeeDiscardConfirmDialog';
import { useOnlineActionGuard } from '../../../../../hooks/useOnlineActionGuard';

export default function RoleEmployeeBulkDrawer({
  isOpen,
  onClose,
  selectedUserIds = new Set(),
  role,
  businessType = 'RESTAURANT',
  businessTypeName,
  rawCatalog = [],
  onSaved,
}) {
  const { t } = useTranslation();
  const { isActionBlocked, blockReason } = useOnlineActionGuard();
  const [saving, setSaving] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  const getInitialToggles = () => Object.fromEntries(Array.from(role?.enabledModuleKeys || []).map((k) => [k, true]));
  const [moduleToggles, setModuleToggles] = useState(getInitialToggles);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL');
  const triggerElementRef = useRef(null);
  const closeButtonRef = useRef(null);
  const drawerRef = useRef(null);

  const userIdsArray = useMemo(() => Array.from(selectedUserIds), [selectedUserIds]);

  const isDirty = useMemo(() => {
    const def = role?.enabledModuleKeys || new Set();
    return Array.from(role?.roleScope || []).some((k) => Boolean(moduleToggles[k]) !== def.has(k));
  }, [moduleToggles, role]);

  const handleRequestClose = () => (isDirty ? setConfirmDiscardOpen(true) : onClose?.());

  useEffect(() => {
    if (!isOpen) return undefined;
    triggerElementRef.current = document.activeElement;
    setSearchQuery('');
    setFilterMode('ALL');
    setConfirmDiscardOpen(false);
    setModuleToggles(getInitialToggles());

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => closeButtonRef.current?.focus(), 50);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      triggerElementRef.current?.focus?.();
    };
  }, [isOpen, role]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (confirmDiscardOpen) setConfirmDiscardOpen(false);
        else handleRequestClose();
      } else if (e.key === 'Tab') {
        e.stopPropagation();
        trapFocus(e, drawerRef.current);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, confirmDiscardOpen, isDirty, onClose]);

  const handleToggle = (id) => setModuleToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  const defaultsMap = useMemo(() => new Map(Array.from(role?.enabledModuleKeys || []).map((k) => [k, true])), [role]);

  const handleSaveBulk = async () => {
    if (saving || userIdsArray.length === 0) return;
    if (!Object.values(moduleToggles).some(Boolean)) {
      toast.error('Kamida bitta modul yoqilgan bo‘lishi shart');
      return;
    }
    if (!isDirty) {
      toast.info('Modullar rol shabloniga to‘liq mos. O‘zgartirish kiritilmadi');
      onClose?.();
      return;
    }

    try {
      setSaving(true);
      let successCount = 0;
      const failedIds = [];
      for (const userId of userIdsArray) {
        try {
          await platformModuleAccessApi.updateUser(userId, { customAccess: true, modules: moduleToggles });
          successCount += 1;
        } catch {
          failedIds.push(userId);
        }
      }
      const failCount = failedIds.length;
      if (failCount === 0) toast.success(`Kirish huquqlari ${successCount} ta xodimga qo‘llandi`);
      else if (successCount > 0) toast.error(`${successCount} ta xodimga saqlandi, lekin ${failCount} tasida xatolik yuz berdi`);
      else toast.error(`Barcha ${failCount} ta xodimga saqlashda xatolik yuz berdi`);
      onSaved?.(failedIds);
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  const catalogGroups = useMemo(
    () => buildCatalogGroups(rawCatalog, businessType, t, role?.roleScope),
    [rawCatalog, businessType, t, role]
  );

  if (!isOpen || userIdsArray.length === 0) return null;

  const drawerNode = (
    <div
      ref={drawerRef}
      className="fixed inset-0 z-[115] flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-edit-title"
    >
      <div className="flex flex-col w-full max-w-xl bg-white h-full shadow-2xl dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        <RoleEmployeeBulkHeader
          selectedCount={userIdsArray.length}
          roleName={role?.name}
          businessTypeName={businessTypeName}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterMode={filterMode}
          setFilterMode={setFilterMode}
          onClose={handleRequestClose}
          closeButtonRef={closeButtonRef}
        />

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <RoleEmployeeEditGroupList
            catalogGroups={catalogGroups}
            moduleToggles={moduleToggles}
            defaultsMap={defaultsMap}
            filterMode={filterMode}
            searchQuery={searchQuery}
            onToggle={handleToggle}
          />
        </div>

        <footer className="border-t border-slate-100 px-6 py-3 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-850 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            {userIdsArray.length} ta xodimga yangilanadi
          </span>
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
              disabled={saving || !isDirty || isActionBlocked}
              title={isActionBlocked ? blockReason : undefined}
              onClick={handleSaveBulk}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              <span>{saving ? 'Qo‘llanilmoqda...' : `${userIdsArray.length} ta xodimga saqlash`}</span>
            </button>
          </div>
        </footer>

        <RoleEmployeeDiscardConfirmDialog
          isOpen={confirmDiscardOpen}
          onStay={() => setConfirmDiscardOpen(false)}
          onDiscard={() => {
            setConfirmDiscardOpen(false);
            onClose?.();
          }}
        />
      </div>
    </div>
  );

  return typeof document !== 'undefined' && document.body ? createPortal(drawerNode, document.body) : drawerNode;
}
