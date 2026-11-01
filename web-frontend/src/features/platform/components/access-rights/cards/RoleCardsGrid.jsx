import React from 'react';
import RoleCard from './RoleCard';

/**
 * Rollar kartochkalari tarmog'i (aktiv va bo'sh rollar) (SRP)
 */
export default function RoleCardsGrid({
  activeRoles = [],
  emptyRoles = [],
  onConfigureRole,
  onViewEmployees,
  currentLang = 'uz',
}) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {activeRoles.map((role) => (
          <RoleCard
            key={role.code}
            role={role}
            onConfigure={(r) => onConfigureRole?.(r)}
            onViewEmployees={(r) => onViewEmployees?.(r)}
          />
        ))}
      </div>

      {emptyRoles.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-slate-200/80 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            {currentLang === 'ru' ? 'Роли без сотрудников' : 'Xodimi bo‘lmagan rollar'} ({emptyRoles.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {emptyRoles.map((role) => (
              <RoleCard
                key={role.code}
                role={role}
                isCompact={true}
                onConfigure={(r) => onConfigureRole?.(r)}
                onViewEmployees={(r) => onViewEmployees?.(r)}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
