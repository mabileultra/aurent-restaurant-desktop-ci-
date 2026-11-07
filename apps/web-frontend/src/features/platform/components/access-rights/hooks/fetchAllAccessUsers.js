import { platformModuleAccessApi } from '../../../../../api';

const PAGE_SIZE = 100;

/**
 * Pull every page from /platform/module-access/users so staff UI is not capped at one request.
 */
export async function fetchAllAccessUsers(params = {}) {
  const first = await platformModuleAccessApi.listUsers({
    ...params,
    page: 0,
    size: PAGE_SIZE,
  }).then((r) => r.data);

  const firstContent = Array.isArray(first) ? first : (first?.content || []);
  const totalElements = Array.isArray(first)
    ? firstContent.length
    : Number(first?.totalElements ?? firstContent.length);
  const totalPages = Array.isArray(first)
    ? 1
    : Math.max(1, Number(first?.totalPages ?? Math.ceil(totalElements / PAGE_SIZE)));

  const all = [...firstContent];
  if (totalPages <= 1) {
    return { content: all, totalElements: totalElements || all.length };
  }

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      platformModuleAccessApi.listUsers({
        ...params,
        page: i + 1,
        size: PAGE_SIZE,
      }).then((r) => {
        const raw = r.data;
        return Array.isArray(raw) ? raw : (raw?.content || []);
      })
    )
  );
  rest.forEach((rows) => all.push(...rows));

  return { content: all, totalElements: totalElements || all.length };
}

/**
 * Pull access history pages (default first N pages until exhausted).
 */
export async function fetchAllAccessHistory(params = {}) {
  const pageSize = Number(params.size) > 0 ? Number(params.size) : 50;
  const first = await platformModuleAccessApi.history({
    ...params,
    page: 0,
    size: pageSize,
  }).then((r) => r.data);

  const firstContent = Array.isArray(first) ? first : (first?.content || []);
  const totalElements = Array.isArray(first)
    ? firstContent.length
    : Number(first?.totalElements ?? firstContent.length);
  const totalPages = Array.isArray(first)
    ? 1
    : Math.max(1, Number(first?.totalPages ?? Math.ceil(totalElements / pageSize)));

  const all = [...firstContent];
  if (totalPages <= 1) {
    return { content: all, totalElements: totalElements || all.length };
  }

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      platformModuleAccessApi.history({
        ...params,
        page: i + 1,
        size: pageSize,
      }).then((r) => {
        const raw = r.data;
        return Array.isArray(raw) ? raw : (raw?.content || []);
      })
    )
  );
  rest.forEach((rows) => all.push(...rows));

  return { content: all, totalElements: totalElements || all.length };
}
