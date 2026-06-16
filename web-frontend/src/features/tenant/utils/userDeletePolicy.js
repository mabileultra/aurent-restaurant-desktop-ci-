/**
 * Кто может удалить пользователя с данной ролью.
 * Супер-админ: админы, менеджеры, кассиры, бухгалтеры.
 * Админ компании: только кассиры.
 */
export function canDeleteUser(actorRole, targetRole) {
  if (!actorRole || !targetRole || targetRole === 'SUPER_ADMIN') return false;
  if (actorRole === 'SUPER_ADMIN') {
    return ['ADMIN', 'MANAGER', 'CASHIER', 'ACCOUNTANT'].includes(targetRole);
  }
  if (actorRole === 'ADMIN') {
    return targetRole === 'CASHIER';
  }
  return false;
}
