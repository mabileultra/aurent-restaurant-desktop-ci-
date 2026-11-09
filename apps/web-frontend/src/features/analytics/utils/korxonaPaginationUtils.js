/**
 * Ro‘yxatlarni sahifalab ko‘rsatish (pagination) uchun sof yordamchi funksiya.
 *
 * @param {Array} items - Asl ma'lumotlar massivi
 * @param {number} page - Joriy sahifa indeksi (0 dan boshlanadi)
 * @param {number} pageSize - Har bir sahifadagi elementlar soni (standart: 10)
 * @returns {{ rows: Array, totalCount: number, from: number, to: number, page: number, totalPages: number, pageSize: number }}
 */
export function paginateList(items = [], page = 0, pageSize = 10) {
  const safeItems = Array.isArray(items) ? items : [];
  const safePageSize = Math.max(1, Number(pageSize) || 10);
  const totalCount = safeItems.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));
  const validPage = Math.max(0, Math.min(Number(page) || 0, totalPages - 1));

  const start = validPage * safePageSize;
  const rows = safeItems.slice(start, start + safePageSize);
  const from = totalCount === 0 ? 0 : start + 1;
  const to = Math.min(start + safePageSize, totalCount);

  return {
    rows,
    totalCount,
    from,
    to,
    page: validPage,
    totalPages,
    pageSize: safePageSize,
  };
}

export default paginateList;
