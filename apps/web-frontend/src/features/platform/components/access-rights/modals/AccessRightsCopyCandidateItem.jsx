import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { resolveRoleLabel } from '../utils/accessRightsCatalogUtils';

export default function AccessRightsCopyCandidateItem({
  user,
  isChecked = false,
  isSameRole = false,
  sourceRole = '',
  onToggle,
}) {
  const uid = user.userId || user.id;

  return (
    <label
      className={`flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
        isSameRole ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <input
          type="checkbox"
          checked={isChecked}
          disabled={!isSameRole}
          onChange={() => isSameRole && onToggle(uid)}
          className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        />
        <div className="min-w-0 truncate">
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {user.fullName || user.username}
          </span>
          <span className="text-slate-400 ml-1 text-[11px]">
            ({resolveRoleLabel(user.role)})
          </span>
        </div>
      </div>

      {!isSameRole && (
        <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium shrink-0 ml-2">
          <AlertTriangle size={11} />
          <span>Rol mos emas ({resolveRoleLabel(sourceRole)} talab qilinadi)</span>
        </span>
      )}
    </label>
  );
}
