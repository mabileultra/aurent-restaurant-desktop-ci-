import React from 'react';
import { useTranslation } from 'react-i18next';
import AccessRightsStaffCardItem from './AccessRightsStaffCardItem';
import AccessRightsStaffBulkBar from './AccessRightsStaffBulkBar';

export default function AccessRightsStaffListPanel({
  users = [],
  totalCount = 0,
  filterTab = 'all',
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
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';

  const allVisibleChecked =
    users.length > 0 && users.every((u) => checkedUserIds.has(u.userId || u.id));

  const checkedUsers = users.filter((u) => checkedUserIds.has(u.userId || u.id));
  const isSameRole = new Set(checkedUsers.map((u) => u.role)).size <= 1;

  return (
    <aside className="w-full lg:w-[340px] shrink-0 space-y-3 relative flex flex-col">
      {/* Header & count */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
        <span>{isRu ? 'Сотрудники' : 'Xodimlar'}</span>
        <span className="text-xs font-normal text-slate-500">
          {users.length} / {totalCount} {isRu ? 'показано' : 'ko‘rsatildi'}
        </span>
      </div>

      {/* Filter chips: Hammasi, Istisnoli, Yangi */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
        {[
          { id: 'all', label: isRu ? `Все ${totalCount}` : `Hammasi ${totalCount}` },
          { id: 'custom', label: isRu ? `Искл. ${exceptionsCount}` : `Istisnoli ${exceptionsCount}` },
          { id: 'new', label: isRu ? `Новые ${newCount}` : `Yangi ${newCount}` },
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
          <span>
            {isRu
              ? `Выбрать всех (${users.length})`
              : `Ko‘rinayotgan ${users.length} xodimni tanlash`}
          </span>
        </label>
      </div>

      {/* User list */}
      <div className="space-y-2 max-h-[calc(100vh-340px)] overflow-y-auto pr-1 flex-1">
        {users.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            {isRu ? 'Сотрудники не найдены' : 'Hech qanday xodim topilmadi'}
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
        isSameRole={isSameRole}
        onResetToTemplate={onResetBulk}
        onApplyCopy={onCopyBulk}
        onClearSelection={onClearChecked}
        isResetting={isResettingBulk}
      />
    </aside>
  );
}
