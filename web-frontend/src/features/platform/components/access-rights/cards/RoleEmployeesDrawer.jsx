import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle } from 'lucide-react';
import RoleEmployeeResetConfirmDialog from './RoleEmployeeResetConfirmDialog';
import RoleEmployeeEditDrawer from './RoleEmployeeEditDrawer';
import RoleEmployeesFilterBar from './RoleEmployeesFilterBar';
import RoleEmployeesBulkBar from './RoleEmployeesBulkBar';
import RoleEmployeesListSection from './RoleEmployeesListSection';
import RoleEmployeeBulkDrawer from './RoleEmployeeBulkDrawer';
import { useRoleEmployeesSelection } from '../hooks/useRoleEmployeesSelection';
import { useRoleEmployeesDrawerState } from '../hooks/useRoleEmployeesDrawerState';
import { trapFocus } from '../utils/focusTrapUtils';
import { filterRoleEmployees } from '../utils/roleEmployeeFilterUtils';

export default function RoleEmployeesDrawer({
  isOpen,
  onClose,
  role,
  businessType = 'RESTAURANT',
  businessTypeName,
  users = [],
  onResetUserToTemplate,
  rawCatalog = [],
  onUserUpdated,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const { filteredUsers, totalCount, exceptionsCount } = filterRoleEmployees(
    users,
    role,
    filterType,
    searchQuery
  );

  const {
    selectedUserIds,
    toggleSelect,
    selectAll,
    clearSelection,
    isAllSelected,
  } = useRoleEmployeesSelection(filteredUsers);

  const {
    confirmUser,
    setConfirmUser,
    editingUser,
    setEditingUser,
    isBulkOpen,
    setIsBulkOpen,
    isResetting,
    handleConfirmReset,
    closeButtonRef,
    drawerRef,
  } = useRoleEmployeesDrawerState({ isOpen, clearSelection, onResetUserToTemplate });

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (editingUser || isBulkOpen) return;
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
  }, [isOpen, onClose, confirmUser, editingUser, isBulkOpen, drawerRef]);

  if (!isOpen || !role) return null;

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

        {totalCount >= 250 && (
          <div className="bg-amber-50/80 border-b border-amber-200/60 px-6 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 flex items-center gap-1.5 shrink-0">
            <AlertCircle size={13} className="shrink-0 text-amber-700" />
            <span>Dastlabki 250 ta xodim ko‘rsatilmoqda (Jami: {totalCount} ta). Qidiruvdan foydalaning.</span>
          </div>
        )}

        <RoleEmployeesFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterType={filterType}
          setFilterType={setFilterType}
          totalCount={totalCount}
          exceptionsCount={exceptionsCount}
          isAllSelected={isAllSelected}
          onSelectAll={selectAll}
        />

        <RoleEmployeesBulkBar
          selectedCount={selectedUserIds.size}
          onApply={() => setIsBulkOpen(true)}
          onClear={clearSelection}
        />

        <RoleEmployeesListSection
          filteredUsers={filteredUsers}
          businessTypeName={businessTypeName}
          selectedUserIds={selectedUserIds}
          onToggleSelect={toggleSelect}
          onEditClick={setEditingUser}
          onResetClick={setConfirmUser}
        />

        <RoleEmployeeResetConfirmDialog
          user={confirmUser}
          isResetting={isResetting}
          onCancel={() => !isResetting && setConfirmUser(null)}
          onConfirm={handleConfirmReset}
        />

        <RoleEmployeeEditDrawer
          isOpen={Boolean(editingUser)}
          onClose={() => setEditingUser(null)}
          user={editingUser}
          businessType={businessType}
          businessTypeName={businessTypeName}
          rawCatalog={rawCatalog}
          onSaved={() => onUserUpdated?.()}
        />

        <RoleEmployeeBulkDrawer
          isOpen={isBulkOpen}
          onClose={() => setIsBulkOpen(false)}
          selectedUserIds={selectedUserIds}
          role={role}
          businessType={businessType}
          businessTypeName={businessTypeName}
          rawCatalog={rawCatalog}
          onSaved={() => {
            clearSelection();
            onUserUpdated?.();
          }}
        />

        <footer className="border-t border-slate-100 px-6 py-3 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-850 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
          >
            Yopish
          </button>
        </footer>
      </div>
    </div>
  );

  return typeof document !== 'undefined' && document.body ? createPortal(drawerNode, document.body) : drawerNode;
}
