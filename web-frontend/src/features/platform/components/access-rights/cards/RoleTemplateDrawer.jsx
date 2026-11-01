import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import RoleTemplateModuleGroupCard from '../templates/RoleTemplateModuleGroupCard';
import RoleTemplateDrawerFooter from './RoleTemplateDrawerFooter';

export default function RoleTemplateDrawer({
  isOpen,
  onClose,
  role,
  businessTypeName,
  moduleGroups = [],
  onSaveTemplate,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL');
  const [activeModules, setActiveModules] = useState(() => new Set());
  const [dirtyModules, setDirtyModules] = useState(() => new Map());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (role && isOpen) {
      setActiveModules(new Set(role.enabledModuleKeys || []));
      setDirtyModules(new Map());
      setSearchQuery('');
      setFilterMode('ALL');
    }
  }, [role, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !role) return null;

  const handleToggleModule = (modId) => {
    setDirtyModules((prev) => {
      const next = new Map(prev);
      const isCurrentlyActive = next.has(modId) ? next.get(modId) : activeModules.has(modId);
      const newState = !isCurrentlyActive;
      if (newState === activeModules.has(modId)) next.delete(modId);
      else next.set(modId, newState);
      return next;
    });
  };

  const handleEnableAllInGroup = (modules) => {
    setDirtyModules((prev) => {
      const next = new Map(prev);
      modules.forEach((m) => {
        if (!activeModules.has(m.id)) next.set(m.id, true);
        else next.delete(m.id);
      });
      return next;
    });
  };

  const handleDisableAllInGroup = (modules) => {
    setDirtyModules((prev) => {
      const next = new Map(prev);
      modules.forEach((m) => {
        if (activeModules.has(m.id)) next.set(m.id, false);
        else next.delete(m.id);
      });
      return next;
    });
  };

  const handleSave = () => {
    setIsSaving(true);
    const finalActive = new Set(activeModules);
    dirtyModules.forEach((val, id) => {
      if (val) finalActive.add(id);
      else finalActive.delete(id);
    });
    setActiveModules(finalActive);
    setDirtyModules(new Map());
    onSaveTemplate?.(role.code, finalActive);
    toast.success(`${role.name} shabloni saqlandi (seans xotirasida)`);
    setIsSaving(false);
    onClose();
  };

  const filteredGroups = moduleGroups
    .map((group) => {
      const matchedModules = group.modules.filter((m) => {
        const isEnabled = dirtyModules.has(m.id) ? dirtyModules.get(m.id) : activeModules.has(m.id);
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
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[100] flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex flex-col w-full max-w-2xl bg-white h-full shadow-2xl dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{role.name} shablonini sozlash</span>
              <span className="text-xs font-normal text-slate-400">· {businessTypeName}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Jami {role.totalEmployees} ta xodim {role.exceptionCount > 0 ? `(${role.exceptionCount} tasida istisno bor)` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </header>

        <div className="bg-emerald-50/70 border-b border-emerald-100/70 px-6 py-2.5 dark:bg-emerald-950/30 dark:border-emerald-900/40 shrink-0">
          <p className="text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 leading-snug">
            <Info size={14} className="shrink-0" />
            <span>Shablondagi o‘zgarishlar shu roldagi barcha standart xodimlarga ta'sir qiladi.</span>
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
          <div className="flex items-center gap-1 text-xs">
            {['ALL', 'ENABLED', 'DISABLED'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilterMode(mode)}
                className={`rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer ${
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
          {filteredGroups.map((group) => (
            <RoleTemplateModuleGroupCard
              key={group.id}
              group={group}
              activeModules={activeModules}
              dirtyModules={dirtyModules}
              onToggleModule={handleToggleModule}
              onEnableAllInGroup={handleEnableAllInGroup}
              onDisableAllInGroup={handleDisableAllInGroup}
            />
          ))}
        </div>

        <RoleTemplateDrawerFooter
          unsavedCount={dirtyModules.size}
          isSaving={isSaving}
          onClose={onClose}
          onSave={handleSave}
        />
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(drawerNode, document.body);
  }
  return drawerNode;
}
