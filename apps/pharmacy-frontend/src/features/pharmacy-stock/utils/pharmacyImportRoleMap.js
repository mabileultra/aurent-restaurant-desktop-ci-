/** Сборка role→index строго по выбору пользователя в dropdown. */
export function buildPharmacyImportRoleMap(roles) {
  const map = {};
  Object.entries(roles || {}).forEach(([index, role]) => {
    if (!role || role === 'SKIP') return;
    const col = Number(index);
    if (!Number.isInteger(col) || col < 0) return;
    if (map[role] == null) map[role] = col;
  });
  return map;
}

/** Смена роли: одна роль — одна колонка. */
export function applyPharmacyImportRoleChange(prev, index, role) {
  const next = { ...prev };
  if (role && role !== 'SKIP') {
    Object.keys(next).forEach((key) => {
      if (String(key) !== String(index) && next[key] === role) {
        next[key] = 'SKIP';
      }
    });
  }
  next[index] = role;
  return next;
}
