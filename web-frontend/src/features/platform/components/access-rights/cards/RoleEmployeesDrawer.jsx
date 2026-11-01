import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, AlertCircle } from 'lucide-react';
import RoleEmployeeListItem from './RoleEmployeeListItem';
import RoleEmployeeResetConfirmDialog from './RoleEmployeeResetConfirmDialog';
import { trapFocus } from '../utils/focusTrapUtils';
import { filterRoleEmployees } from '../utils/roleEmployeeFilterUtils';

export default function RoleEmployeesDrawer({
  isOpen,
  onClose,
  role,
  businessTypeName,
  users = [],
  onResetUserToTemplate,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [confirmUser, setConfirmUser] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const triggerElementRef = useRef(null);
  const closeButtonRef = useRef(null);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      triggerElementRef.current = document.activeElement;
      setConfirmUser(null);
      setSearchQuery('');
      setFilterType('ALL');

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => closeButtonRef.current?.focus(), 50);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalOverflow;
        triggerElementRef.current?.focus?.();
      };
    }
    return undefined;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (confirmUser) setConfirmUser(null);
        else onClose?.();
      } else if (e.key === 'Tab') {
        trapFocus(e, drawerRef.current);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, confirmUser]);

  if (!isOpen || !role) return null;

  const { filteredUsers, totalCount, exceptionsCount } = filterRoleEmployees(
    users,
    role,
    filterType,
    searchQuery
  );

  const handleConfirmReset = async () => {
    if (!confirmUser || isResetting) return;
    try {
      setIsResetting(true);
      const userId = confirmUser.userId || confirmUser.id;
      await onResetUserToTemplate?.(userId);
      setConfirmUser(null);
    } finally {
      setIsResetting(false);
    }
  };

  const drawerNode = (
    <div
      ref={drawerRef}
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[100] flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="employees-drawer-title"
    >
      <div className="flex flex-col w-full max-w-xl bg-white h-full shadow-2xl dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800 shrink-0">
          <div>
            <h3 id="employees-drawer-title" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{role.name} xodimlari</span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">· {businessTypeName}</span>
            </h3>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
              Jami {totalCount} ta xodim · {exceptionsCount} tasida istisno bor
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

        {totalCount >= 500 && (
          <div className="bg-amber-50/80 border-b border-amber-200/60 px-6 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 flex items-center gap-1.5 shrink-0">
            <AlertCircle size={13} className="shrink-0 text-amber-700" />
            <span>Faqat dastlabki 500 ta xodim ko‘rsatilmoqda. Qidiruvdan foydalaning.</span>
          </div>
        )}

        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 space-y-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ism, login yoki kompaniya..."
              aria-label="Xodimlar bo‘yicha qidiruv"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {[
              { id: 'ALL', label: `Hammasi (${totalCount})` },
              { id: 'EXCEPTIONS', label: `Istisnoli (${exceptionsCount})` },
              { id: 'TEMPLATE', label: `Faqat shablon (${totalCount - exceptionsCount})` },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id)}
                className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                  filterType === f.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2.5">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500 dark:text-slate-400">
              Ushbu filtr bo‘yicha xodim topilmadi
            </div>
          ) : (
            filteredUsers.map((u) => (
              <RoleEmployeeListItem
                key={u.userId || u.id}
                user={u}
                businessTypeName={businessTypeName}
                onResetClick={setConfirmUser}
              />
            ))
          )}
        </div>

        <RoleEmployeeResetConfirmDialog
          user={confirmUser}
          isResetting={isResetting}
          onCancel={() => !isResetting && setConfirmUser(null)}
          onConfirm={handleConfirmReset}
        />

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
