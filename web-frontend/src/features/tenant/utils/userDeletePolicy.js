/**
 * Кто может удалить пользователя с данной ролью.
 * Супер-админ: админы, менеджеры, кассиры, бухгалтеры.
 * Админ компании: только кассиры.
 */
export function canDeleteUser(actorRole, targetRole) {
  if (!actorRole || !targetRole || targetRole === 'SUPER_ADMIN' || targetRole === 'PLATFORM_ADMIN') return false;
  if (actorRole === 'SUPER_ADMIN' || actorRole === 'PLATFORM_ADMIN') {
    return ['ADMIN', 'MANAGER', 'CASHIER', 'ACCOUNTANT'].includes(targetRole);
  }
  if (actorRole === 'ADMIN') {
    return targetRole === 'CASHIER';
  }
  return false;
}
