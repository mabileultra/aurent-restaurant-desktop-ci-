import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, RotateCcw } from 'lucide-react';
import { resolveModuleName } from '../utils/accessRightsCatalogUtils';

export default function RoleEmployeesDrawer({
  isOpen,
  onClose,
  role,
  businessTypeName,
  users = [],
  catalogMap = {},
  onResetUserToTemplate,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !role) return null;

  const roleUsers = users.filter((u) => {
    const isRoleMatch =
      String(u.roleCode || u.role).toUpperCase() === role.code.toUpperCase() ||
      String(u.role).toLowerCase() === String(role.name).toLowerCase();
    if (!isRoleMatch) return false;
    const hasExceptions = Boolean(u.moduleAccessCustom || u.customAccess || u.hasExceptions);
    if (filterType === 'EXCEPTIONS' && !hasExceptions) return false;
    if (filterType === 'TEMPLATE' && hasExceptions) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.companyName || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const allRoleUsers = users.filter((u) =>
    String(u.roleCode || u.role).toUpperCase() === role.code.toUpperCase() ||
    String(u.role).toLowerCase() === String(role.name).toLowerCase()
  );
  const totalCount = allRoleUsers.length;
  const exceptionsCount = allRoleUsers.filter(
    (u) => Boolean(u.moduleAccessCustom || u.customAccess || u.hasExceptions)
  ).length;

  const drawerNode = (
    <div
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[100] flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex flex-col w-full max-w-xl bg-white h-full shadow-2xl dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{role.name} xodimlari</span>
              <span className="text-xs font-normal text-slate-400">· {businessTypeName}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Jami {totalCount} ta xodim · {exceptionsCount} tasida istisno bor
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
            <X size={18} />
          </button>
        </header>

        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 space-y-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ism, login yoki kompaniya..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                filterType === 'ALL' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
              }`}
            >
              Hammasi ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('EXCEPTIONS')}
              className={`rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                filterType === 'EXCEPTIONS' ? 'bg-amber-600 text-white' : 'text-amber-700 hover:bg-amber-50 dark:text-amber-400'
              }`}
            >
              Istisnoli ({exceptionsCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('TEMPLATE')}
              className={`rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                filterType === 'TEMPLATE' ? 'bg-emerald-700 text-white' : 'text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400'
              }`}
            >
              Faqat shablon ({totalCount - exceptionsCount})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2.5">
          {roleUsers.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">Ushbu filtr bo‘yicha xodim topilmadi</div>
          ) : (
            roleUsers.map((u) => {
              const hasExceptions = Boolean(u.moduleAccessCustom || u.customAccess || u.hasExceptions);
              const userId = u.userId || u.id;
              const initials = (u.fullName || u.username || 'U').substring(0, 2).toUpperCase();

              return (
                <div key={userId} className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-850">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{u.fullName || u.username}</span>
                        {hasExceptions ? (
                          <span className="rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.2 text-[10px] font-semibold text-amber-700 dark:bg-amber-950 dark:border-amber-900 dark:text-amber-300">
                            Istisno bor
                          </span>
                        ) : (
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            Shablon
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{u.username} · {u.companyName || businessTypeName}</p>
                      {u.deniedModules?.length > 0 && (
                        <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                          − {u.deniedModules.map((id) => resolveModuleName(id, catalogMap)).join(', ')} (taqiq)
                        </p>
                      )}
                      {u.grantedModules?.length > 0 && (
                        <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          + {u.grantedModules.map((id) => resolveModuleName(id, catalogMap)).join(', ')} (qo‘shimcha)
                        </p>
                      )}
                    </div>
                  </div>

                  {hasExceptions && (
                    <button
                      type="button"
                      onClick={() => onResetUserToTemplate?.(userId)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 cursor-pointer shrink-0 ml-2"
                    >
                      <RotateCcw size={11} />
                      <span>Shablonga qaytarish</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <footer className="border-t border-slate-100 px-6 py-3 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-850 flex justify-end shrink-0">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 cursor-pointer">
            Yopish
          </button>
        </footer>
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(drawerNode, document.body);
  }
  return drawerNode;
}
