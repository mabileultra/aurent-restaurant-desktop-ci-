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
  const [saving, setSaving] = useState(false);
  const [moduleToggles, setModuleToggles] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL');
  const triggerElementRef = useRef(null);
  const closeButtonRef = useRef(null);
  const drawerRef = useRef(null);

  const userIdsArray = useMemo(() => Array.from(selectedUserIds), [selectedUserIds]);

  useEffect(() => {
    if (!isOpen) return undefined;
    triggerElementRef.current = document.activeElement;
    setSearchQuery('');
    setFilterMode('ALL');

    const defaultToggles = {};
    if (role?.enabledModuleKeys) {
      role.enabledModuleKeys.forEach((k) => {
        defaultToggles[k] = true;
      });
    }
    setModuleToggles(defaultToggles);

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
        onClose?.();
      } else if (e.key === 'Tab') {
        trapFocus(e, drawerRef.current);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleToggle = (id) => setModuleToggles((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleSaveBulk = async () => {
    if (saving || userIdsArray.length === 0) return;
    const hasAtLeastOne = Object.values(moduleToggles).some(Boolean);
    if (!hasAtLeastOne) {
      toast.error('Kamida bitta modul yoqilgan bo‘lishi shart');
      return;
    }

    try {
      setSaving(true);
      for (const userId of userIdsArray) {
        await platformModuleAccessApi.updateUser(userId, { customAccess: true, modules: moduleToggles });
      }
      toast.success(`Kirish huquqlari ${userIdsArray.length} ta xodimga qo‘llandi`);
      onSaved?.();
      onClose?.();
    } catch {
      toast.error('Ommaviy saqlashda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const catalogGroups = useMemo(() => {
    return buildCatalogGroups(rawCatalog, businessType, t);
  }, [rawCatalog, businessType, t]);

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
          onClose={onClose}
          closeButtonRef={closeButtonRef}
        />

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <RoleEmployeeEditGroupList
            catalogGroups={catalogGroups}
            moduleToggles={moduleToggles}
            defaultsMap={new Map()}
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
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveBulk}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-60"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              <span>{saving ? 'Qo‘llanilmoqda...' : `${userIdsArray.length} ta xodimga saqlash`}</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );

  return typeof document !== 'undefined' && document.body ? createPortal(drawerNode, document.body) : drawerNode;
}
