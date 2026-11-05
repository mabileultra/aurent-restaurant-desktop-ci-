import React from 'react';
import { BaseSelect } from '../../../../components/ui';

export const PLATFORM_FILTER_ROLES = [
  'MANAGEMENT',
  'STAFF',
  'ADMIN',
  'MANAGER',
  'CASHIER',
  'WAITER',
  'COOK',
  'COURIER',
  'ACCOUNTANT',
  'PLATFORM_ADMIN',
  'PLATFORM_ANALYTICS',
];

export default function UserRoleFilter({ t, role = '', onChange }) {
  const options = [
    { value: '', label: t('users.allRoles', { defaultValue: 'Barcha rollar' }) },
    { value: 'MANAGEMENT', label: t('users.filterManagement', { defaultValue: 'Administrator va menejerlar' }) },
    { value: 'STAFF', label: t('users.filterStaff', { defaultValue: 'Xizmat ko\'rsatish xodimlari' }) },
    ...PLATFORM_FILTER_ROLES.filter((r) => r !== 'MANAGEMENT' && r !== 'STAFF').map((code) => ({
      value: code,
      label: t(`roles.${code}`, code),
    })),
  ];

  return (
    <BaseSelect
      className="users-filters__role min-w-[140px] sm:min-w-[170px]"
      size="sm"
      label={t('users.filterRole', { defaultValue: 'Rol' })}
      value={role}
      onChange={(e) => onChange(e.target.value)}
      options={options}
      searchable={false}
    />
  );
}
