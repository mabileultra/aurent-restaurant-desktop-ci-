export function truncateTablePreviewName(name, maxLength = 14) {
  if (!name) return '';
  const trimmed = String(name).trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, Math.max(1, maxLength - 1))}…`;
}

export function formatTableCheckPreviewItems(session, maxNames = 2) {
  const items = (session?.previewItems ?? []).slice(0, maxNames);
  const more = Number(session?.moreItemsCount ?? 0);
  const text = items.map((name) => truncateTablePreviewName(name)).filter(Boolean).join(', ');
  if (!text) return '';
  return more > 0 ? `${text} +${more}` : text;
}
