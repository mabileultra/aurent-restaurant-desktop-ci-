/**
 * Rol xodimlarini filtrlash va istisnolarni hisoblash yordamchisi (SRP)
 */
export function filterRoleEmployees(users = [], role, filterType = 'ALL', searchQuery = '') {
  if (!role) return { allRoleUsers: [], filteredUsers: [], totalCount: 0, exceptionsCount: 0 };

  const roleCodeUpper = role.code.toUpperCase();
  const roleNameLower = String(role.name || '').toLowerCase();

  const allRoleUsers = users.filter((u) => {
    const code = String(u.roleCode || u.role).toUpperCase();
    return code === roleCodeUpper || String(u.role).toLowerCase() === roleNameLower;
  });

  const totalCount = allRoleUsers.length;
  const exceptionsCount = allRoleUsers.filter(
    (u) => Boolean(u.moduleAccessCustom || u.customAccess || u.hasExceptions)
  ).length;

  const q = searchQuery.toLowerCase().trim();

  const filteredUsers = allRoleUsers.filter((u) => {
    const hasExceptions = Boolean(u.moduleAccessCustom || u.customAccess || u.hasExceptions);
    if (filterType === 'EXCEPTIONS' && !hasExceptions) return false;
    if (filterType === 'TEMPLATE' && hasExceptions) return false;
    if (q) {
      return (
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.companyName || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return { allRoleUsers, filteredUsers, totalCount, exceptionsCount };
}
