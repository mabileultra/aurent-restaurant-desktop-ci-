/** Validate modifier group selection against min/max. */

export function countSelectedInGroup(group, selectedIds) {
  const ids = new Set((selectedIds ?? []).map(String));
  return (group.options ?? []).filter((option) => ids.has(String(option.id))).length;
}

export function validateModifierSelection(groups, selectedIds) {
  for (const group of groups ?? []) {
    const count = countSelectedInGroup(group, selectedIds);
    const min = Number(group.minSelect ?? 0);
    const max = Number(group.maxSelect ?? 0);
    if (count < min) {
      return { ok: false, group, reason: 'min', count, min, max };
    }
    if (max > 0 && count > max) {
      return { ok: false, group, reason: 'max', count, min, max };
    }
  }
  return { ok: true };
}

export function canToggleModifierOption(group, optionId, selectedIds) {
  const ids = (selectedIds ?? []).map(String);
  const optionKey = String(optionId);
  const already = ids.includes(optionKey);
  if (already) return true;
  const max = Number(group.maxSelect ?? 0);
  if (max <= 0) return true;
  return countSelectedInGroup(group, selectedIds) < max;
}
