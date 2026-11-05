/** Код маркировки для Multikassa: 1:1 как со сканера (без обрезки хвоста). */
export function preserveMarkingCodeForFiscal(raw) {
  if (raw == null) return '';
  return String(raw).replace(/^\uFEFF/, '').trimEnd();
}
