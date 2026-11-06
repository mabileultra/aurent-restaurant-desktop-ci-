import React from 'react';
import AccessRightsStaffCardItem from './AccessRightsStaffCardItem';
import AccessRightsStaffBulkBar from './AccessRightsStaffBulkBar';

export default function AccessRightsStaffListPanel({
  users = [],
  totalCount = 0,
  filterTab = 'all', // 'all' | 'custom' | 'new'
  onFilterTabChange,
  exceptionsCount = 0,
  newCount = 0,
  selectedUserId,
  onSelectUser,
  checkedUserIds = new Set(),
  onToggleCheckUser,
  onToggleCheckAll,
  onResetBulk,
  onCopyBulk,
  onClearChecked,
  isResettingBulk = false,
}) {
  const allVisibleChecked = users.length > 0 && users.every((u) => checkedUserIds.has(u.userId || u.id));

  return (
    <aside className="w-full lg:w-[340px] shrink-0 space-y-3">
      {/* Header & count */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
        <span>Xodimlar</span>
        <span className="text-[11px] font-normal text-slate-500">
          {users.length} / {totalCount} ko‘rsatildi
        </span>
      </div>

      {/* Filter chips: Hammasi, Istisnoli, Yangi */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
        {[
          { id: 'all', label: `Hammasi ${totalCount}` },
          { id: 'custom', label: `Istisnoli ${exceptionsCount}` },
          { id: 'new', label: `Yangi ${newCount}` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onFilterTabChange(tab.id)}
            className={`flex-1 py-1 text-center text-xs font-bold rounded-lg transition-all ${
              filterTab === tab.id
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Select all checkbox */}
      <div className="flex items-center justify-between px-1 py-0.5 text-xs text-slate-600 dark:text-slate-400">
        <label className="flex items-center gap-2 cursor-pointer font-medium">
          <input
            type="checkbox"
            checked={allVisibleChecked}
            onChange={(e) => onToggleCheckAll(e.target.checked)}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
          />
          <span>Ko‘rinayotgan {users.length} xodimni tanlash</span>
        </label>
      </div>

      {/* User list */}
      <div className="space-y-2 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
        {users.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            Hech qanday xodim topilmadi
          </div>
        ) : (
          users.map((user) => {
            const uid = user.userId || user.id;
            return (
              <AccessRightsStaffCardItem
                key={uid}
                user={user}
                isSelected={selectedUserId === uid}
                isChecked={checkedUserIds.has(uid)}
                onSelect={() => onSelectUser(user)}
                onCheck={(checked) => onToggleCheckUser(uid, checked)}
              />
            );
          })
        )}
      </div>

      {/* Bulk action bar */}
      <AccessRightsStaffBulkBar
        selectedCount={checkedUserIds.size}
        onResetToTemplate={onResetBulk}
        onApplyCopy={onCopyBulk}
        onClearSelection={onClearChecked}
        isResetting={isResettingBulk}
      />
    </aside>
  );
}
