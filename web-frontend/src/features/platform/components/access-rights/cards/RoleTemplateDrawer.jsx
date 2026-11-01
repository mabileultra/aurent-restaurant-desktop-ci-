import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, ShieldCheck } from 'lucide-react';
import RoleTemplateModuleGroupCard from './RoleTemplateModuleGroupCard';
import RoleTemplateDrawerFooter from './RoleTemplateDrawerFooter';
import { trapFocus } from '../utils/focusTrapUtils';
import { useRoleTemplateEditor } from '../hooks/useRoleTemplateEditor';

export default function RoleTemplateDrawer({
  isOpen,
  onClose,
  role,
  businessType,
  businessTypeName,
  moduleGroups = [],
  onSaved,
}) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterMode, setFilterMode] = React.useState('ALL');
  const triggerElementRef = useRef(null);
  const closeButtonRef = useRef(null);
  const drawerRef = useRef(null);

  const fallbackEnabledKeys = useMemo(
    () => Array.from(role?.enabledModuleKeys || []),
    [role]
  );

  const editor = useRoleTemplateEditor({
    isOpen,
    businessType,
    roleCode: role?.code,
    fallbackEnabledKeys,
    onSaved,
  });

  useEffect(() => {
    if (isOpen) {
      triggerElementRef.current = document.activeElement;
      setSearchQuery('');
      setFilterMode('ALL');

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalOverflow;
        if (triggerElementRef.current && typeof triggerElementRef.current.focus === 'function') {
          triggerElementRef.current.focus();
        }
      };
    }
    return undefined;
  }, [isOpen]);

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

  if (!isOpen || !role) return null;

  const roleScope = role.roleScope || editor.activeModules;

  const filteredGroups = moduleGroups
    .map((group) => {
      const scopeModules = group.modules.filter((m) => roleScope.has(m.id));
      const matchedModules = scopeModules.filter((m) => {
        const isEnabled = editor.dirtyModules.has(m.id)
          ? editor.dirtyModules.get(m.id)
          : editor.activeModules.has(m.id);
        if (filterMode === 'ENABLED' && !isEnabled) return false;
        if (filterMode === 'DISABLED' && isEnabled) return false;
        if (searchQuery.trim()) {
          return m.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
        }
        return true;
      });
      return { ...group, modules: matchedModules };
    })
    .filter((group) => group.modules.length > 0);

  const drawerNode = (
    <div
      ref={drawerRef}
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[100] flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-drawer-title"
    >
      <div className="flex flex-col w-full max-w-2xl bg-white h-full shadow-2xl dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800 shrink-0">
          <div>
            <h3
              id="template-drawer-title"
              className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2"
            >
              <span>{role.name} shablon huquqlari</span>
              <span className="rounded-md bg-emerald-100 text-emerald-900 text-[10px] px-2 py-0.5 font-bold dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                {editor.source === 'TEMPLATE' ? 'Saqlangan' : 'Standart'}
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">· {businessTypeName}</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Jami {role.totalEmployees} ta xodim {role.exceptionCount > 0 ? `(${role.exceptionCount} tasida istisno mavjud)` : ''}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Panelni yopish"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </header>

        <div className="bg-emerald-50/80 border-b border-emerald-200/60 px-6 py-2.5 dark:bg-emerald-950/30 dark:border-emerald-900/40 shrink-0">
          <p className="text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 leading-snug">
            <ShieldCheck size={14} className="shrink-0" />
            <span>
              Shablonni o‘zgartiring va saqlang. Istisnosiz xodimlar yangi shablonga avtomatik o‘tadi.
            </span>
          </p>
        </div>

        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Modul nomi..."
              aria-label="Modul nomi bo‘yicha qidiruv"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
          <div className="flex items-center gap-1 text-xs">
            {['ALL', 'ENABLED', 'DISABLED'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilterMode(mode)}
                className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                  filterMode === mode
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                {mode === 'ALL' ? 'Hammasi' : mode === 'ENABLED' ? 'Yoqilgan' : 'O‘chirilgan'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {editor.isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">Yuklanmoqda…</div>
          ) : filteredGroups.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              Qidiruv bo‘yicha modullar topilmadi.
            </div>
          ) : (
            filteredGroups.map((group) => (
              <RoleTemplateModuleGroupCard
                key={group.id}
                group={group}
                activeModules={editor.activeModules}
                dirtyModules={editor.dirtyModules}
                onToggleModule={editor.toggleModule}
                onEnableAllInGroup={editor.enableAllInGroup}
                onDisableAllInGroup={editor.disableAllInGroup}
                isReadOnly={false}
              />
            ))
          )}
        </div>

        <RoleTemplateDrawerFooter
          onClose={onClose}
          onSave={editor.save}
          isDirty={editor.isDirty}
          isSaving={editor.isSaving}
          applyToExisting={editor.applyToExisting}
          onApplyToExistingChange={editor.setApplyToExisting}
        />
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(drawerNode, document.body);
  }
  return drawerNode;
}
