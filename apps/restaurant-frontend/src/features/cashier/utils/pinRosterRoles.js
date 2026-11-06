/** Role badge labels / CSS modifiers for terminal roster cards. */

export function pinRoleBadgeClass(role) {
  switch (String(role || '').toUpperCase()) {
    case 'MANAGER':
      return 'is-manager';
    case 'CASHIER':
      return 'is-cashier';
    case 'WAITER':
      return 'is-waiter';
    case 'COOK':
      return 'is-cook';
    default:
      return 'is-default';
  }
}

export function pinRoleLabel(role, t) {
  switch (String(role || '').toUpperCase()) {
    case 'MANAGER':
      return t('users.roleManager', { defaultValue: 'Менеджер' });
    case 'CASHIER':
      return t('users.roleCashier', { defaultValue: 'Кассир' });
    case 'WAITER':
      return t('users.roleWaiter', { defaultValue: 'Официант' });
    case 'COOK':
      return t('users.roleCook', { defaultValue: 'Повар' });
    default:
      return role || '';
  }
}

export function staffInitial(displayName) {
  const name = String(displayName || '').trim();
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}
