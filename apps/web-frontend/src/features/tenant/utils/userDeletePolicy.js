/**
 * Kim qaysi roldagi foydalanuvchini o'chira olishini belgilaydi.
 * Platforma administratori (SUPER_ADMIN / PLATFORM_ADMIN): barcha kompaniya xodimlarini o'chira oladi.
 * Kompaniya admini (ADMIN): operatsion xodimlarni (kassir, ofitsiant, oshpaz, kuryer) o'chira oladi.
 */
export function canDeleteUser(actorRole, targetRole) {
  if (!actorRole || !targetRole || targetRole === 'SUPER_ADMIN' || targetRole === 'PLATFORM_ADMIN') return false;
  if (actorRole === 'SUPER_ADMIN' || actorRole === 'PLATFORM_ADMIN') {
    return ['ADMIN', 'MANAGER', 'CASHIER', 'ACCOUNTANT', 'WAITER', 'COOK', 'COURIER'].includes(targetRole);
  }
  if (actorRole === 'ADMIN') {
    return ['CASHIER', 'WAITER', 'COOK', 'COURIER'].includes(targetRole);
  }
  return false;
}
