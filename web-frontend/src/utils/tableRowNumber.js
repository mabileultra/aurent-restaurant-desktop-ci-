/** 0-based page → absolute row number for table № column */
export function tableRowNumber(page, pageSize, index) {
  const p = Number(page) || 0;
  const size = Number(pageSize) || 0;
  const i = Number(index) || 0;
  if (size <= 0) return i + 1;
  return p * size + i + 1;
}
